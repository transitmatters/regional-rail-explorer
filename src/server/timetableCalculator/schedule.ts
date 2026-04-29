// Per-segment kinematic engine, ported column-for-column from the
// "Schedule" tab of the source spreadsheet.
//
// Velocity is in m/s, distance in meters, time in seconds throughout.
// Two-phase acceleration model:
//   - below transition_V (= P/F): constant force ⇒ a = F/m, dv/dt = a
//   - above transition_V:        constant power ⇒ a = P/(m·v)
// Deceleration is constant (= braking_rate).

import { ReferenceData } from "./load";
import { PlatformStandard, ScheduleOptions, ScheduleRow, ServiceSegment, Trainset } from "./types";

const MPH_79 = 79 * 0.44704; // 35.31616 m/s — the legacy MBTA cap

// Distance to accelerate from v0 to v with a constant-force phase up to
// transition_V and a constant-power phase above. v0, v >= 0.
const accelDist = (v0: number, v: number, t: Trainset): number => {
    if (v <= v0) return 0;
    const tV = t.transitionV;
    const a = t.accel;
    if (v <= tV) {
        return (v * v - v0 * v0) / (2 * a);
    }
    const v0c = Math.max(v0, tV);
    const lowPhase = v0 < tV ? (tV * tV - v0 * v0) / (2 * a) : 0;
    const highPhase = (t.mass * (v ** 3 - v0c ** 3)) / (3 * t.power);
    return lowPhase + highPhase;
};

const accelTime = (v0: number, v: number, t: Trainset): number => {
    if (v <= v0) return 0;
    const tV = t.transitionV;
    const a = t.accel;
    if (v <= tV) {
        return (v - v0) / a;
    }
    const v0c = Math.max(v0, tV);
    const lowPhase = v0 < tV ? (tV - v0) / a : 0;
    const highPhase = (t.mass * (v * v - v0c * v0c)) / (2 * t.power);
    return lowPhase + highPhase;
};

const decelDist = (vStart: number, vEnd: number, decel: number): number => {
    if (vEnd >= vStart) return 0;
    return (vStart * vStart - vEnd * vEnd) / (2 * decel);
};

// Largest topV reachable in `dist` accelerating from v0 (used when the
// segment has no decel constraint and there's room beyond the cruise dist).
const topVFromDistance = (v0: number, dist: number, t: Trainset): number => {
    const tV = t.transitionV;
    if (v0 >= tV) {
        // Pure constant-power phase: dist = m(v³ - v0³)/(3P)
        const v3 = v0 ** 3 + (3 * t.power * dist) / t.mass;
        return Math.cbrt(v3);
    }
    // Constant force up to tV?
    const distToTV = (tV * tV - v0 * v0) / (2 * t.accel);
    if (dist <= distToTV) {
        return Math.sqrt(v0 * v0 + 2 * t.accel * dist);
    }
    const remaining = dist - distToTV;
    const v3 = tV ** 3 + (3 * t.power * remaining) / t.mass;
    return Math.cbrt(v3);
};

const dwellFor = (
    seg: ServiceSegment,
    standards: Map<PlatformStandard["type"], number>,
    stopType: PlatformStandard["type"] | null,
    opts: ScheduleOptions
): number => {
    if (!seg.stopHere) return 0;
    const platformType = opts.allHighLevel ? "High" : (stopType ?? "Low");
    const base = standards.get(platformType) ?? 0;
    return opts.rushHourLoad ? base * 2 : base;
};

const segmentVmaxToggle = (segVmax: number, t: Trainset, opts: ScheduleOptions): number => {
    const cap = opts.cap79mph ? Math.min(t.vmax, MPH_79) : t.vmax;
    return Math.min(segVmax, cap);
};

export const runSchedule = (
    data: ReferenceData,
    serviceName: string,
    opts: ScheduleOptions
): ScheduleRow[] => {
    const svc = data.services.get(serviceName);
    if (!svc) throw new Error(`Unknown service: ${serviceName}`);
    const trainset = data.trainsets.get(opts.trainset);
    if (!trainset) throw new Error(`Unknown trainset: ${opts.trainset}`);

    const lastOrd = Math.max(...svc.segments.map((s) => s.ord));

    // Pre-compute per-row Vmax_toggle so we can peek at the next segment.
    const rows: ScheduleRow[] = svc.segments.map((seg) => {
        const segVmax = opts.useFutureRoW ? seg.futureVmax : seg.currentVmax;
        const vmaxToggle = segmentVmaxToggle(segVmax, trainset, opts);
        const stopRef = seg.type === "Stop" ? data.stops.get(seg.segment) : null;
        const stopType = stopRef ? stopRef.platformType : null;
        return {
            segment: seg.segment,
            type: seg.type,
            ord: seg.ord,
            stopHere: seg.stopHere,
            distance: seg.distance,
            vmax: segVmax,
            vmaxToggle,
            stopDwell: dwellFor(seg, data.standards, stopType, opts),
            decelMaxV: 0,
            endV: 0,
            startV: 0,
            decelDist: 0,
            decelTime: 0,
            distAfterDecel: 0,
            segmentTopV: 0,
            accelToTransVDist: 0,
            accelFromTransVDist: 0,
            totalAccelDist: 0,
            accelTime: 0,
            cruiseDist: 0,
            cruiseTime: 0,
            totalTime: 0,
            paddingAdd: 0,
            cumulTime: 0,
            cumulDist: 0,
        };
    });

    // decel_max_V: max speed we can ENTER this segment at, computed backward
    // from the end of the route.
    //  - Origin stop: 0 (train starts at rest).
    //  - Mandatory stop: sqrt(2·decel·dist) — fastest entry that still decels
    //    to 0 within the platform length.
    //  - Otherwise (RoW or skip-stop): sqrt(next.decel_max_V² + 2·decel·dist)
    //    — fastest entry that still decels to the next segment's max entry
    //    speed within this segment's distance.
    //  - Last segment (no next): treated as if next.decel_max_V = 0 for stops,
    //    Infinity (i.e. just vmaxToggle) for RoW.
    // All cases are then capped by this segment's own vmaxToggle.
    const decel = trainset.brakingRate;
    for (let i = rows.length - 1; i >= 0; i--) {
        const r = rows[i];
        const next = rows[i + 1];
        if (i === 0 && r.stopHere) {
            r.decelMaxV = 0;
            continue;
        }
        if (r.type === "Stop" && r.stopHere) {
            r.decelMaxV = Math.min(r.vmaxToggle, Math.sqrt(2 * decel * r.distance));
        } else {
            const nextDM = next ? next.decelMaxV : 0;
            r.decelMaxV = Math.min(
                r.vmaxToggle,
                Math.sqrt(nextDM * nextDM + 2 * decel * r.distance)
            );
        }
    }

    // Walk forward, computing each row from prev.endV.
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const next = rows[i + 1];

        r.startV = i === 0 ? 0 : rows[i - 1].endV;

        if (r.stopHere) {
            r.endV = 0;
        } else {
            const nextDecelMaxV = next ? next.decelMaxV : r.decelMaxV;
            r.endV = Math.min(r.decelMaxV, nextDecelMaxV);
        }

        // Quirk: decel_dist uses startV → endV (the actual physical decel),
        // but decel_time uses decelMaxV → endV. For most segments these are
        // equal (startV == decelMaxV when the prev segment didn't cap exit
        // speed), but where they differ (e.g. r28 of Providence Local) the
        // fixture follows this asymmetric pair.
        r.decelDist = decelDist(r.startV, r.endV, trainset.brakingRate);
        r.decelTime = r.endV < r.startV ? (r.decelMaxV - r.endV) / trainset.brakingRate : 0;
        r.distAfterDecel = Math.max(0, r.distance - r.decelDist);

        // segmentTopV: peak speed reachable across distAfterDecel starting
        // from startV, capped by vmaxToggle. Same formula for Stop and RoW —
        // at a stop, distAfterDecel is usually ~0 so topV ≈ startV, and at
        // origin it's startV=0 so topV stays 0.
        const reachable = topVFromDistance(r.startV, r.distAfterDecel, trainset);
        r.segmentTopV = Math.min(reachable, r.vmaxToggle);

        // Two-phase accel distance from start_V up to topV (uses real startV).
        const totalAccel = accelDist(r.startV, r.segmentTopV, trainset);
        r.totalAccelDist = totalAccel;
        const tV = trainset.transitionV;
        if (r.segmentTopV <= tV) {
            r.accelToTransVDist = totalAccel;
            r.accelFromTransVDist = 0;
        } else {
            const lowPhase =
                r.startV < tV ? (tV * tV - r.startV * r.startV) / (2 * trainset.accel) : 0;
            r.accelToTransVDist = lowPhase;
            r.accelFromTransVDist = Math.max(0, totalAccel - lowPhase);
        }

        // Spreadsheet quirks (verified against Schedule_set1 fixture):
        //   - accel_time = 0 if total_accel_dist == 0 (no actual accel happens
        //     this segment, e.g. cruising or pure decel).
        //   - Otherwise accel_time = time(0 → topV), full two-phase from rest,
        //     regardless of startV. Distance columns use real startV; time
        //     pretends we started from zero. This adds ~28s of "padding" at
        //     each stop on top of clean physics — it's the model the existing
        //     calculator uses, so we replicate it.
        const ACCEL_EPS = 1e-6; // floating-point slop guard
        r.accelTime = r.totalAccelDist > ACCEL_EPS ? accelTime(0, r.segmentTopV, trainset) : 0;

        r.cruiseDist = r.segmentTopV > 0 ? Math.max(0, r.distAfterDecel - r.totalAccelDist) : 0;
        r.cruiseTime = r.segmentTopV > 0 ? r.cruiseDist / r.segmentTopV : 0;

        r.paddingAdd = opts.endPadding && r.ord === lastOrd ? 300 : 0;

        // Origin (first segment, no entry speed and stopped): no time elapses.
        const isOrigin = i === 0 && r.startV === 0 && r.endV === 0;
        r.totalTime = isOrigin
            ? 0
            : r.decelTime + r.accelTime + r.cruiseTime + r.stopDwell + r.paddingAdd;
    }

    let cumT = 0;
    let cumD = 0;
    for (const r of rows) {
        cumT += r.totalTime;
        cumD += r.distance;
        r.cumulTime = cumT;
        r.cumulDist = cumD;
    }

    return rows;
};
