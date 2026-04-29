import fs from "fs";
import path from "path";

import parse from "csv-parse/lib/sync";

import { PlatformStandard, RoWRef, Service, ServiceSegment, StopRef, Trainset } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "timetable-calculator");

const MPH_TO_MPS = 0.44704;

const num = (v: string): number => (v === "" ? NaN : Number(v));
const numOrNull = (v: string): number | null => (v === "" ? null : Number(v));

const readCsv = <T>(filename: string): T[] => {
    const raw = fs.readFileSync(path.join(DATA_DIR, filename), "utf8");
    return parse(raw, { delimiter: ",", columns: true });
};

interface RawTrainset {
    Consist: string;
    Mass: string;
    Force: string;
    Power: string;
    Vmax: string;
    Braking_rate: string;
}

interface RawStop {
    Stop: string;
    Platform_type: PlatformStandard["type"];
    Corridor: string;
    Dwell_time: string;
    Platform_Length: string;
    Current_speed: string;
    Future_speed: string;
}

interface RawRoW {
    RoW_ID: string;
    From: string;
    To: string;
    Distance: string;
    Current_Speed: string;
    Future_Speed: string;
    Notes: string;
}

interface RawService {
    Service_ID: string;
    Name: string;
    Segment: string;
    Segment_type: string;
    Segment_ord: string;
    Stop_here: string;
    Dist: string;
    Line: string;
}

interface RawStandard {
    "Platform type": PlatformStandard["type"];
    "Dwell time": string;
}

export const loadTrainsets = (): Map<string, Trainset> => {
    const rows = readCsv<RawTrainset>("trainsets.csv");
    const out = new Map<string, Trainset>();
    for (const r of rows) {
        const mass = num(r.Mass);
        const force = num(r.Force);
        const power = num(r.Power);
        out.set(r.Consist, {
            consist: r.Consist,
            mass,
            force,
            power,
            vmax: num(r.Vmax),
            brakingRate: num(r.Braking_rate),
            accel: force / mass,
            transitionV: power / force,
        });
    }
    return out;
};

export const loadPlatformStandards = (): Map<PlatformStandard["type"], number> => {
    const rows = readCsv<RawStandard>("platform-standards.csv");
    const out = new Map<PlatformStandard["type"], number>();
    for (const r of rows) {
        out.set(r["Platform type"], num(r["Dwell time"]));
    }
    return out;
};

export const loadStops = (): Map<string, StopRef> => {
    const rows = readCsv<RawStop>("stops.csv");
    const out = new Map<string, StopRef>();
    for (const r of rows) {
        out.set(r.Stop, {
            name: r.Stop,
            platformType: r.Platform_type,
            corridor: r.Corridor,
            dwell: num(r.Dwell_time),
            platformLength: numOrNull(r.Platform_Length),
            currentSpeedMph: numOrNull(r.Current_speed),
            futureSpeedMph: numOrNull(r.Future_speed),
        });
    }
    return out;
};

export const loadRows = (): Map<string, RoWRef> => {
    const rows = readCsv<RawRoW>("rows.csv");
    const out = new Map<string, RoWRef>();
    for (const r of rows) {
        out.set(r.RoW_ID, {
            id: r.RoW_ID,
            from: r.From,
            to: r.To,
            distance: num(r.Distance),
            currentSpeedMph: num(r.Current_Speed),
            futureSpeedMph: num(r.Future_Speed),
            notes: r.Notes || undefined,
        });
    }
    return out;
};

export const loadServices = (): Map<string, Service> => {
    const rows = readCsv<RawService>("services.csv");
    const out = new Map<string, Service>();
    for (const r of rows) {
        const name = r.Name;
        const type = r.Segment_type.trim() as ServiceSegment["type"];
        const seg: ServiceSegment = {
            serviceId: r.Service_ID,
            name,
            segment: r.Segment,
            type,
            ord: num(r.Segment_ord),
            stopHere: r.Stop_here.toUpperCase() === "TRUE",
            distance: num(r.Dist),
            // Vmax columns are recomputed in code from base mph values; we
            // ignore the stored m/s here to avoid carrying 2-decimal rounding.
            currentVmax: 0,
            futureVmax: 0,
            line: r.Line,
        };
        if (!out.has(name)) {
            out.set(name, { name, line: r.Line, segments: [] });
        }
        out.get(name)!.segments.push(seg);
    }
    for (const svc of out.values()) {
        svc.segments.sort((a, b) => a.ord - b.ord);
    }
    return out;
};

export interface ReferenceData {
    trainsets: Map<string, Trainset>;
    standards: Map<PlatformStandard["type"], number>;
    stops: Map<string, StopRef>;
    rows: Map<string, RoWRef>;
    services: Map<string, Service>;
}

// Resolve each ServiceSegment's currentVmax / futureVmax in m/s by looking
// the segment up in Stops or RoW. The spreadsheet does this via VLOOKUP in
// the Service sheet; we reproduce it here so the data is self-contained.
export const resolveServiceVmax = (data: ReferenceData) => {
    for (const svc of data.services.values()) {
        for (const seg of svc.segments) {
            if (seg.type === "Stop") {
                const s = data.stops.get(seg.segment);
                if (!s) throw new Error(`Unknown stop in service: ${seg.segment}`);
                // Spreadsheet quirk: stops use Future_speed for both Vmax
                // columns regardless of the Current/Future toggle. The toggle
                // only swings RoW track speeds. Stops represent platform
                // approach speed (a track-design property, not operational).
                const stopVmax = (s.futureSpeedMph ?? 0) * MPH_TO_MPS;
                seg.currentVmax = stopVmax;
                seg.futureVmax = stopVmax;
            } else {
                const r = data.rows.get(seg.segment);
                if (!r) throw new Error(`Unknown RoW in service: ${seg.segment}`);
                seg.currentVmax = r.currentSpeedMph * MPH_TO_MPS;
                seg.futureVmax = r.futureSpeedMph * MPH_TO_MPS;
            }
        }
    }
};

export const loadReferenceData = (): ReferenceData => {
    const data: ReferenceData = {
        trainsets: loadTrainsets(),
        standards: loadPlatformStandards(),
        stops: loadStops(),
        rows: loadRows(),
        services: loadServices(),
    };
    resolveServiceVmax(data);
    return data;
};
