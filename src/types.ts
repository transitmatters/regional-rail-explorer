import { BlockquoteHTMLAttributes } from "react";

export type Indexed<T> = { [key: string]: T };

export type Duration = number;

export interface GtfsRoute {
    routeId: string;
    routeLongName: string;
}
export interface GtfsTrip {
    routeId: string;
    tripId: string;
    serviceId: string;
    tripHeadsign: string;
    directionId: string;
}

export interface GtfsStopTime {
    stopId: string;
    tripId: string;
    arrivalTime: string;
}

export interface GtfsTransfer {
    fromStopId: string;
    toStopId: string;
    minWalkTime: string;
}

type BoolString = "0" | "1";
export interface GtfsService {
    serviceId: string;
    monday: BoolString;
    tuesday: BoolString;
    wednesday: BoolString;
    thursday: BoolString;
    friday: BoolString;
    saturday: BoolString;
    sunday: BoolString;
}

export interface GtfsStop {
    stopId: string;
    stopCode: string;
    stopName: string;
    stopDesc: string;
    locationType: string;
    platformCode: string;
    platformName: string;
    parentStation: string;
}

export interface StopTime {
    time: NetworkTime;
    stop: Stop;
    trip: Trip;
}

export interface Trip {
    id: string;
    serviceId: string;
    routeId: string;
    directionId: string;
    serviceDays: NetworkDay[];
    stopTimes: StopTime[];
}

export interface Transfer {
    fromStop: Stop;
    toStop: Stop;
    minWalkTime: Duration;
}

export interface Stop {
    id: string;
    name: string;
    description: string;
    stopTimes: StopTime[];
    transfers: Transfer[];
    serviceIds: string[];
    parentStation: Station;
}

export interface Station {
    id: string;
    name: string;
    stops: Stop[];
}

export interface Network {
    stations: Indexed<Station>;
}

export interface Station {
    id: string;
    name: string;
    stops: Stop[];
}

export type NetworkDay =
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";

export type NetworkDayKind = "weekday" | "saturday" | "sunday";

export type NetworkTime = number;

export type NetworkTimeRange = [NetworkTime, NetworkTime];

export interface NetworkDayTime {
    time: NetworkTime;
    day: NetworkDay | NetworkDayKind;
}
