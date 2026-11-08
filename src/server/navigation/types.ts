import {
    Duration,
    NetworkDay,
    NetworkDayKind,
    NetworkDayTime,
    NetworkTime,
    Station,
    StopTime,
    NavigationKind,
} from "types";

export type NavigationOptions = {
    fromStation: Station;
    toStation: Station;
    initialDayTime: NetworkDayTime;
    unifiedFares: boolean;
    navigationKind?: NavigationKind;
};

export type NavigationContext = Readonly<{
    today: NetworkDayKind | NetworkDay;
    initialTime: NetworkTime;
    origin: Station;
    goal: Station;
    reverse: boolean;
    unifiedFares: boolean;
}>;

type BaseNavigationState = {
    context: NavigationContext;
    time: NetworkTime;
    parents: NavigationState[];
    boardedAtStations: Set<Station>;
    boardedRoutePatternIds: Set<string>;
    boardedRegionalRailCount: number;
    timeOnSilverLine: number;
    // Time spent walking between stations
    timeWalking: number;
};

export type StartNavigationState = BaseNavigationState & {
    kind: "start";
};

// A walk out of one station and into another, in the order the search visits them
export type StationWalk = {
    from: Station;
    to: Station;
};

export type TransferNavigationState = BaseNavigationState & {
    kind: "transfer";
    walkDuration: Duration;
    walk: null | StationWalk;
    from: null | StopTime;
    to: StopTime;
};

export type TravelNavigationState = BaseNavigationState & {
    kind: "travel";
    from: StopTime;
    to: StopTime;
};

// Getting off at a station near the goal and walking the rest of the way
export type WalkNavigationState = BaseNavigationState & {
    kind: "walk";
    walk: StationWalk;
    walkDuration: Duration;
    fromTime: NetworkTime;
};

export type NavigationState =
    StartNavigationState | TransferNavigationState | TravelNavigationState | WalkNavigationState;
