import {
    Duration,
    NetworkDay,
    NetworkDayKind,
    NetworkDayTime,
    NetworkTime,
    Station,
    StopTime,
} from "types";

export type NavigationOptions = {
    fromStation: Station;
    toStation: Station;
    initialDayTime: NetworkDayTime;
    unifiedFares: boolean;
    reverse?: boolean;
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
};

export type StartNavigationState = BaseNavigationState & {
    kind: "start";
};

export type TransferNavigationState = BaseNavigationState & {
    kind: "transfer";
    walkDuration: Duration;
    from: null | StopTime;
    to: StopTime;
};

export type TravelNavigationState = BaseNavigationState & {
    kind: "travel";
    from: StopTime;
    to: StopTime;
};

export type NavigationState =
    | StartNavigationState
    | TransferNavigationState
    | TravelNavigationState;
