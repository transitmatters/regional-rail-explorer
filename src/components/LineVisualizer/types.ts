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

export type PathShape = [PathStart, ...(StationRange | PathCommand)[]];

export type PathInterpolator = (frac: number) => Turtle;

export const pathEntryIsStationRange = (el: PathShape[number]): el is StationRange =>
    el && typeof el === "object" && el.type === "stationRange";

interface Station {
    id: string;
    name: string;
}

export interface StationWithOffset extends Station {
    offset: number;
}

export interface RouteDescriptor {
    shape: PathShape;
    stations: Station[];
}

export interface PrerenderedRoute {
    id: string;
    pathInterpolator: PathInterpolator;
    stations: StationWithOffset[];
}
