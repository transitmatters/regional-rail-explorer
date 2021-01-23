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
    start?: string;
    end?: string;
    stations?: string[];
    commands: PathCommand[];
}

export type PathShape = readonly [PathStart, ...(StationRange | PathCommand)[]];

export type PathInterpolator = (frac: number) => Turtle;

export const pathEntryIsStationRange = (el: PathShape[number]): el is StationRange =>
    el && typeof el === "object" && el.type === "stationRange";

export interface RoutePatternDescriptor {
    shape: PathShape;
    stationIds: string[];
}
export interface PrerenderedRoutePattern {
    id: string;
    pathInterpolator: PathInterpolator;
    stationOffsets: Record<string, number>;
}
