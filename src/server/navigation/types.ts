import { Stop, NetworkDayTime, Station, Trip, Transfer } from "../../types";

type BaseNavigationState = {
    dayTime: NetworkDayTime;
    seen: Set<Stop>;
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
    departPreviousStopTime: NetworkDayTime;
    arriveAtThisStopTime: NetworkDayTime;
}

export type NavigationState = StartNavigationState | StopNavigationState;
