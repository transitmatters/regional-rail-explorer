import { Route } from "./model";
import { NetworkTime } from "./time";

export interface SerializableStopTime {
    stationId: string;
    time: NetworkTime;
}

export interface SerializableTrip {
    id: string;
    directionId: string;
    routePatternId: string;
    stopTimes: SerializableStopTime[];
}

export interface BranchMap {
    routePatternIds: string[];
    stationIds: string[];
    branches?: BranchMap[];
}

export interface SerializableRouteInfo extends Route {
    stationNames: Record<string, string>;
    branchMap: BranchMap;
    weekdayTrips: SerializableTrip[];
}
