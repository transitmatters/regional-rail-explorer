export interface Turtle {
    x: number;
    y: number;
    theta: number;
}

export interface PathStart {
    type: "start";
    turtle: Turtle;
}

export interface PathSegment {
    type: "line" | "curve" | "wiggle";
    path: string;
    turtle: Turtle;
    length: number;
    get: (frac: number) => Turtle;
}

export type PathCommand = (t: Turtle) => PathSegment;

export interface StationRange {
    type: "stationRange";
    start: null | string;
    end: null | string;
    stations: null | string[];
    commands: PathCommand[];
}

export type PathShape = readonly [PathStart, ...(StationRange | PathCommand)[]];

export type PathInterpolator = (progress: number) => Turtle;

export const pathEntryIsStationRange = (el: PathShape[number]): el is StationRange =>
    el && typeof el === "object" && el.type === "stationRange";

export interface RoutePatternDescriptor {
    shape: PathShape;
    stationIds: string[];
}
export interface PrerenderedRoutePattern {
    id: string;
    pathInterpolator: PathInterpolator;
    progressPathInterpolator: PathInterpolator;
    stationOffsets: Record<string, number>;
}
