// Reference data and types for the Timetable Calculator port. Mirrors the
// columns of the source spreadsheet's Trainsets / Stops / RoW / Service tabs.
//
// Velocities are stored in m/s (derived in code from the mph base values).
// Distances in meters, times in seconds.

export interface Trainset {
    consist: string;
    mass: number; // kg
    force: number; // N
    power: number; // W
    vmax: number; // m/s
    brakingRate: number; // m/s²
    // accel = force/mass, transitionV = power/force — both derived in load.ts.
    accel: number; // m/s² (constant-force phase)
    transitionV: number; // m/s (boundary between constant-force and constant-power)
}

export interface PlatformStandard {
    type: "Low" | "Mini-high" | "High";
    dwell: number; // s
}

export interface StopRef {
    name: string;
    platformType: PlatformStandard["type"];
    corridor: string;
    dwell: number; // s
    platformLength: number | null; // m, distance the train traverses through the platform
    currentSpeedMph: number | null;
    futureSpeedMph: number | null;
}

export interface RoWRef {
    id: string;
    from: string;
    to: string;
    distance: number; // m
    currentSpeedMph: number;
    futureSpeedMph: number;
    notes?: string;
}

export interface ServiceSegment {
    serviceId: string;
    name: string;
    segment: string; // stop name or RoW id
    type: "Stop" | "RoW";
    ord: number;
    stopHere: boolean;
    distance: number; // m
    currentVmax: number; // m/s
    futureVmax: number; // m/s
    line: string;
}

export interface Service {
    name: string;
    line: string;
    segments: ServiceSegment[];
}

export interface ScheduleOptions {
    trainset: string; // consist name
    useFutureRoW: boolean;
    cap79mph: boolean; // MBTA 79mph overall limit
    allHighLevel: boolean; // force every stop dwell to "High" (30 s)
    rushHourLoad: boolean; // doubles dwell
    endPadding: boolean; // adds 5 min to last stop
}

export interface ScheduleRow {
    segment: string;
    type: "Stop" | "RoW";
    ord: number;
    stopHere: boolean;
    distance: number;
    vmax: number;
    vmaxToggle: number; // effective Vmax after trainset cap and 79 mph cap
    stopDwell: number;
    decelMaxV: number;
    endV: number;
    startV: number;
    decelDist: number;
    decelTime: number;
    distAfterDecel: number;
    segmentTopV: number;
    accelToTransVDist: number;
    accelFromTransVDist: number;
    totalAccelDist: number;
    accelTime: number;
    cruiseDist: number;
    cruiseTime: number;
    totalTime: number;
    paddingAdd: number;
    cumulTime: number;
    cumulDist: number;
}
