import Heap from "heap";

import { compareTimes, matchDayOfWeek, stringifyTime } from "time";
import { NavigationFailedError } from "errors";
import {
    Duration,
    NetworkDay,
    NetworkDayKind,
    NetworkTime,
    Station,
    Stop,
    StopTime,
    Transfer,
} from "types";
import { isRegionalRailRouteId } from "routes";

import {
    NavigationContext,
    NavigationOptions,
    NavigationState,
    StartNavigationState,
    TransferNavigationState,
    TravelNavigationState,
} from "./types";
import { resolveTemporalOrder } from "./util";

const scoreState = (state: NavigationState) => {
    return Math.abs(state.time - state.context.initialTime);
};

const getStatePriorityHeap = (): Heap<NavigationState> => {
    return new Heap((a: NavigationState, b: NavigationState) => scoreState(a) - scoreState(b));
};

const getSelfTransfer = (stop: Stop): Transfer => {
    return {
        fromStop: stop,
        toStop: stop,
        minWalkTime: 60,
    };
};

const getNextStopTimesForServiceAndDirection = (stopTimes: StopTime[], stop: Stop) => {
    return ["0", "1"]
        .map((directionId) => {
            return stop.routes
                .map((route) => {
                    const shouldExploreRoutePatterns = isRegionalRailRouteId(route.id);
                    if (shouldExploreRoutePatterns) {
                        return route.routePatternIds.map((routePatternId) =>
                            stopTimes.find(
                                (stopTime) =>
                                    stopTime.trip.routePatternId === routePatternId &&
                                    stopTime.trip.directionId === directionId
                            )
                        );
                    }
                    return stopTimes.find(
                        (stopTime) =>
                            stopTime.trip.routeId === route.id &&
                            stopTime.trip.directionId === directionId
                    );
                })
                .flat();
        })
        .flat()
        .filter((x): x is StopTime => !!x);
};

const displaceTime = (start: NetworkTime, duration: Duration, reverse: boolean): NetworkTime => {
    return start + duration * (reverse ? -1 : 1);
};

const isSuccessorTime = (first: NetworkTime, second: NetworkTime, reverse: boolean) => {
    const comparison = compareTimes(first, second);
    return reverse ? comparison <= 0 : comparison >= 0;
};

const isStopTimeToday = (stopTime: StopTime, today: NetworkDayKind | NetworkDay) => {
    return stopTime.trip.serviceDays.some((day) => matchDayOfWeek(day, today));
};

const isUsefulStopToExplore = (stop: Stop, goal: Station) => {
    if (stop.parentStation === goal) {
        return true;
    }
    const uniqueRoutes = new Set(stop.parentStation.stops.map((stop) => stop.routes).flat());
    return uniqueRoutes.size > 1;
};

const isGoalState = (state: NavigationState) => {
    return state.kind === "travel" && state.to.stop.parentStation === state.context.goal;
};

const createStartState = (context: NavigationContext): StartNavigationState => {
    return {
        kind: "start",
        context,
        boardedAtStations: new Set(),
        boardedRoutePatternIds: new Set(),
        boardedRouteIds: new Set(),
        time: context.initialTime,
        parents: [],
    };
};

const createTransferState = (
    parent: NavigationState,
    stopTime: StopTime,
    from: null | StopTime,
    walkDuration: number
): TransferNavigationState => {
    const { boardedAtStations, boardedRoutePatternIds, boardedRouteIds, parents, context } = parent;
    return {
        kind: "transfer" as const,
        context,
        parents: [...parents, parent],
        from,
        to: stopTime,
        time: stopTime.time,
        boardedAtStations: new Set([...boardedAtStations, stopTime.stop.parentStation]),
        boardedRouteIds: new Set([...boardedRouteIds, stopTime.trip.routeId]),
        boardedRoutePatternIds: new Set([...boardedRoutePatternIds, stopTime.trip.routePatternId]),
        walkDuration,
    };
};

const getNextVisitableStopTimes = (state: NavigationState, stop: Stop, now: NetworkTime) => {
    const { boardedAtStations, boardedRoutePatternIds, context } = state;
    const { reverse, today } = context;
    const { stopTimes } = stop;
    const justAlightedRegionalRail =
        state.kind === "travel" && isRegionalRailRouteId(state.to.trip.routeId);
    const shouldAvoidRegionalRailTransfer = !state.context.unifiedFares && justAlightedRegionalRail;

    if (boardedAtStations.has(stop.parentStation)) {
        return [];
    }

    const boardableStopTimes = stopTimes.filter((stopTime) => {
        return (
            isStopTimeToday(stopTime, today) &&
            isSuccessorTime(stopTime.time, now, reverse) &&
            !(shouldAvoidRegionalRailTransfer && isRegionalRailRouteId(stopTime.trip.routeId)) &&
            !boardedRoutePatternIds.has(stopTime.trip.routePatternId)
        );
    });

    return getNextStopTimesForServiceAndDirection(
        state.context.reverse ? boardableStopTimes.reverse() : boardableStopTimes,
        stop
    );
};

const getTransferStates = (parent: TravelNavigationState): TransferNavigationState[] => {
    const { to, context } = parent;
    return [
        ...to.stop.transfers.filter((tr) => tr.fromStop.id === to.stop.id),
        getSelfTransfer(to.stop),
    ]
        .map((transfer) => {
            const walkDuration = transfer.minWalkTime;
            const now = displaceTime(to.time, walkDuration, context.reverse);
            const visitableStopTimes = getNextVisitableStopTimes(parent, transfer.toStop, now);
            return visitableStopTimes.map((stopTime) => {
                return createTransferState(parent, stopTime, to, walkDuration);
            });
        })
        .flat();
};

const getTravelStates = (parent: TransferNavigationState): TravelNavigationState[] => {
    const {
        to,
        context,
        boardedRoutePatternIds,
        boardedRouteIds,
        boardedAtStations,
        parents,
    } = parent;

    const candidateEndStopsOnTrip = to.trip.stopTimes.filter((stopTime) => {
        return (
            isSuccessorTime(stopTime.time, to.time, context.reverse) &&
            isUsefulStopToExplore(stopTime.stop, context.goal)
        );
    });

    return candidateEndStopsOnTrip.map((stopTime) => {
        return {
            kind: "travel" as const,
            context,
            parents: [...parents, parent],
            from: to,
            to: stopTime,
            time: stopTime.time,
            boardedAtStations,
            boardedRoutePatternIds,
            boardedRouteIds,
        };
    });
};

const getTransferStatesFromStartState = (
    parent: StartNavigationState
): TransferNavigationState[] => {
    const { context } = parent;
    const { origin, initialTime } = context;
    return origin.stops
        .map((stop) => {
            const visitableStopTimes = getNextVisitableStopTimes(parent, stop, initialTime);
            return visitableStopTimes.map((stopTime) => {
                return createTransferState(parent, stopTime, null, 0);
            });
        })
        .flat();
};

const getSuccessorStates = (state: NavigationState): NavigationState[] => {
    if (state.kind === "start") {
        return getTransferStatesFromStartState(state);
    }
    if (state.kind === "travel") {
        return getTransferStates(state);
    }
    return getTravelStates(state);
};

const getBestStatesFromHeap = (heap: Heap<NavigationState>): NavigationState[] => {
    const firstState = heap.pop();
    const equallyGoodStates: NavigationState[] = [firstState];
    while (!heap.empty() && heap.peek().time === firstState.time) {
        equallyGoodStates.push(heap.pop());
    }
    return equallyGoodStates.sort((a, b) => a.parents.length - b.parents.length);
};

export const printTripFromState = (state: NavigationState) => {
    [...state.parents, state].forEach((state) => {
        const time = stringifyTime(state.time);
        if (state.kind === "start") {
            console.log(time, state.context.origin.name);
        }
        if (state.kind === "travel" || state.kind === "transfer") {
            console.log(
                time,
                state.kind,
                state.from?.stop.parentStation.name || "<start>",
                "->",
                state.to.stop.parentStation.name
            );
        }
    });
};

export const navigateBetweenStations = (options: NavigationOptions) => {
    const { fromStation, toStation, initialDayTime, unifiedFares, reverse = false } = options;
    const [origin, goal] = resolveTemporalOrder(fromStation, toStation, reverse);
    const startState = createStartState({
        today: initialDayTime.day,
        initialTime: initialDayTime.time,
        origin,
        goal,
        reverse,
        unifiedFares,
    });
    const stateHeap = getStatePriorityHeap();
    const visitedStations = new Set<Station>([origin]);
    stateHeap.push(startState);
    while (!stateHeap.empty()) {
        const nextBestStates = getBestStatesFromHeap(stateHeap);
        for (const state of nextBestStates) {
            if (state.kind === "travel") {
                if (visitedStations.has(state.to.stop.parentStation)) {
                    continue;
                }
                visitedStations.add(state.to.stop.parentStation);
            }
            if (isGoalState(state)) {
                return state;
            }
            getSuccessorStates(state).forEach((newState) => stateHeap.push(newState));
        }
    }
    throw new NavigationFailedError();
};
