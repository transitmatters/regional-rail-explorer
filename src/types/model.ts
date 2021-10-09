import { loadGtfsNetwork } from "server/network";

import { Duration, NetworkTime, NetworkDay } from "./time";

export interface StopTime {
    time: NetworkTime;
    stop: Stop;
    trip: Trip;
}

export interface Route {
    id: string;
    name: string;
    routePatternIds: string[];
}

export interface Trip {
    id: string;
    serviceId: string;
    routeId: string;
    routePatternId: string;
    directionId: string;
    serviceDays: NetworkDay[];
    stopTimes: StopTime[];
    route: Route;
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
    routes: Route[];
    parentStation: Station;
    levelBoarding: boolean;
}

export interface Station {
    id: string;
    name: string;
    stops: Stop[];
}

export interface Amenities {
    levelBoarding: boolean;
    electricTrains: boolean;
    increasedTopSpeed: boolean;
}

export type AmenityName = keyof Amenities;

export type Network = ReturnType<typeof loadGtfsNetwork>;

export interface ScenarioInfo {
    id: string;
    name: string;
}

export interface Scenario extends ScenarioInfo {
    unifiedFares: boolean;
    network: Network;
}
