import { Stop, NetworkDayTime, Station, Trip, Transfer, NetworkTime } from "../../types";

type BaseNavigationState = {
    dayTime: NetworkDayTime;
    seen: Set<Stop>;
    seenRoutePatternIds: Set<string>;
    parents: NavigationState[];
};

export interface StartNavigationState extends BaseNavigationState {
    type: "start";
    station: Station;
}

export interface StopNavigationState extends BaseNavigationState {
    type: "stop";
    trip: Trip;
    stop: Stop;
    previousStop: Stop;
    fromTransfer: null | Transfer;
    boardingTime: NetworkTime;
    alightingTime: NetworkTime;
}

export type NavigationState = StartNavigationState | StopNavigationState;
