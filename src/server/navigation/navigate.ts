import Heap from "heap";

import { compareTimes, matchDayOfWeek, stringifyTime } from "time";
import { NavigationFailedError } from "errors";
import {
    Duration,
    NetworkDay,
    NetworkDayKind,
    NetworkDayTime,
    NetworkTime,
    Station,
    Stop,
    StopTime,
    Transfer,
} from "types";
import { isRegionalRail } from "routes";

import {
    NavigationContext,
    NavigationState,
    StartNavigationState,
    TransferNavigationState,
    TravelNavigationState,
} from "./types";

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
        minWalkTime: 0,
    };
};

const getNextStopTimesForServiceAndDirection = (stopTimes: StopTime[], stop: Stop) => {
    return ["0", "1"]
        .map((directionId) => {
            return stop.routes
                .map((route) => {
                    const shouldExploreRoutePatterns = isRegionalRail(route.id);
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

const displaceTime = (start: NetworkTime, duration: Duration, backwards: boolean): NetworkTime => {
    return start + duration * (backwards ? -1 : 1);
};

const isSuccessorTime = (first: NetworkTime, second: NetworkTime, backwards: boolean) => {
    const comparison = compareTimes(first, second);
    return backwards ? comparison <= 0 : comparison >= 0;
};

const isStopTimeToday = (stopTime: StopTime, today: NetworkDayKind | NetworkDay) => {
    return stopTime.trip.serviceDays.some((day) => matchDayOfWeek(day, today));
};

const isUsefulStopToExplore = (stop: Stop, goal: Station) => {
    return (
        stop.parentStation === goal ||
        stop.parentStation.stops.map((stop) => stop.routes).flat().length > 1
    );
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
    const { boardedAtStations, boardedRoutePatternIds, parents, context } = parent;
    return {
        kind: "transfer" as const,
        context,
        parents: [...parents, parent],
        from,
        to: stopTime,
        time: stopTime.time,
        boardedAtStations: new Set([...boardedAtStations, stopTime.stop.parentStation]),
        boardedRoutePatternIds: new Set([...boardedRoutePatternIds, stopTime.trip.routePatternId]),
        walkDuration,
    };
};

const getNextVisitableStopTimes = (state: NavigationState, stop: Stop, now: NetworkTime) => {
    const { boardedAtStations, boardedRoutePatternIds, context } = state;
    const { backwards, today } = context;
    const { stopTimes } = stop;

    if (boardedAtStations.has(stop.parentStation)) {
        return [];
    }

    const boardableStopTimes = stopTimes.filter((stopTime) => {
        return (
            isStopTimeToday(stopTime, today) &&
            isSuccessorTime(stopTime.time, now, backwards) &&
            !boardedRoutePatternIds.has(stopTime.trip.routePatternId)
        );
    });

    return getNextStopTimesForServiceAndDirection(boardableStopTimes, stop);
};

const getTransferStates = (parent: TravelNavigationState): TransferNavigationState[] => {
    const { to, context } = parent;
    return [
        ...to.stop.transfers.filter((tr) => tr.fromStop.id === to.stop.id),
        getSelfTransfer(to.stop),
    ]
        .map((transfer) => {
            const walkDuration = transfer.minWalkTime;
            const now = displaceTime(to.time, walkDuration, context.backwards);
            const visitableStopTimes = getNextVisitableStopTimes(parent, transfer.toStop, now);
            return visitableStopTimes.map((stopTime) => {
                return createTransferState(parent, stopTime, to, walkDuration);
            });
        })
        .flat();
};

const getTravelStates = (parent: TransferNavigationState): TravelNavigationState[] => {
    const { to, context, boardedRoutePatternIds, boardedAtStations, parents } = parent;

    const candidateEndStopsOnTrip = to.trip.stopTimes.filter((stopTime) => {
        return (
            isSuccessorTime(stopTime.time, to.time, context.backwards) &&
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

const printTripFromState = (state: NavigationState) => {
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

export const navigateBetweenStations = (
    origin: Station,
    goal: Station,
    initialDayTime: NetworkDayTime,
    backwards: boolean = false
) => {
    const startState = createStartState({
        today: initialDayTime.day,
        initialTime: initialDayTime.time,
        origin: backwards ? goal : origin,
        goal: backwards ? origin : goal,
        backwards,
    });
    const stateHeap = getStatePriorityHeap();
    const visitedStations = new Set<Station>([origin]);
    stateHeap.push(startState);
    let stateCount = 0;
    const startTime = Date.now();
    while (!stateHeap.empty()) {
        const nextBestStates = getBestStatesFromHeap(stateHeap);
        for (const state of nextBestStates) {
            stateCount++;
            console.log("~~~~~~~~~~");
            printTripFromState(state);
            if (state.kind === "travel") {
                if (visitedStations.has(state.to.stop.parentStation)) {
                    continue;
                }
                visitedStations.add(state.to.stop.parentStation);
            }
            if (isGoalState(state)) {
                console.log(
                    `explored ${stateCount} states in ${Math.round(Date.now() - startTime)}ms (new)`
                );
                return state;
            }
            getSuccessorStates(state).forEach((newState) => stateHeap.push(newState));
        }
    }
    throw new NavigationFailedError();
};
