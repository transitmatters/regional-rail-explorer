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
    const {
        timeOnSilverLine,
        boardedRegionalRailCount,
        boardedRoutePatternIds,
        time,
        context: { unifiedFares, initialTime },
    } = state;
    // It's prohibitively expensive to take CR-CR trips without unified fares
    const regionalRailOveruseWeight = unifiedFares ? 0.0 : 0.5;
    const regionalRailOverusePenalty =
        regionalRailOveruseWeight * (Math.max(1, boardedRegionalRailCount) - 1);
    // Transferring many times adds variability and is rarely as smooth as it looks on paper.
    const tooManyTransfersPenalty = 180 * Math.max(0, boardedRoutePatternIds.size - 2);
    // The Silver Line is...much slower than its GTFS schedule claims. We account for that here.
    const silverLinePenalty = 0.5 * timeOnSilverLine;
    const penaltyWeights = 1 + regionalRailOverusePenalty;
    return (
        penaltyWeights * Math.abs(time - initialTime) + silverLinePenalty + tooManyTransfersPenalty
    );
};

const getStatePriorityHeap = (): Heap<NavigationState> => {
    return new Heap((a: NavigationState, b: NavigationState) => scoreState(a) - scoreState(b));
};

const getSelfTransfer = (stop: Stop): Transfer => {
    return {
        fromStop: stop,
        toStop: stop,
        walkTime: 3 * 60,
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
        boardedRegionalRailCount: 0,
        time: context.initialTime,
        timeOnSilverLine: 0,
        parents: [],
    };
};

const createTransferState = (
    parent: NavigationState,
    stopTime: StopTime,
    from: null | StopTime,
    walkDuration: number
): TransferNavigationState => {
    const {
        boardedAtStations,
        boardedRoutePatternIds,
        boardedRegionalRailCount: boardedRegionalRailCount,
        parents,
        context,
        timeOnSilverLine,
    } = parent;
    const boardingRegionalRail = isRegionalRailRouteId(stopTime.trip.routeId);
    return {
        kind: "transfer" as const,
        context,
        parents: [...parents, parent],
        from,
        to: stopTime,
        time: stopTime.time,
        boardedAtStations: new Set([...boardedAtStations, stopTime.stop.parentStation]),
        boardedRoutePatternIds: new Set([...boardedRoutePatternIds, stopTime.trip.routePatternId]),
        boardedRegionalRailCount: boardingRegionalRail
            ? boardedRegionalRailCount + 1
            : boardedRegionalRailCount,
        walkDuration,
        timeOnSilverLine,
    };
};

const getNextVisitableStopTimes = (state: NavigationState, stop: Stop, now: NetworkTime) => {
    const { boardedAtStations, boardedRoutePatternIds, context } = state;
    const { reverse, today } = context;
    // const reverse = navigationKind === "arrive-by"
    const { stopTimes } = stop;

    if (boardedAtStations.has(stop.parentStation)) {
        return [];
    }

    const boardableStopTimes = stopTimes.filter((stopTime) => {
        return (
            isStopTimeToday(stopTime, today) &&
            isSuccessorTime(stopTime.time, now, reverse) &&
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
            const walkDuration = transfer.walkTime;
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
        boardedAtStations,
        boardedRegionalRailCount: boardedRegionalRailCount,
        parents,
        timeOnSilverLine,
    } = parent;

    const isSilverLine = to.trip.routeId.startsWith("7");
    const candidateEndStopsOnTrip = to.trip.stopTimes.filter((stopTime) => {
        return (
            isSuccessorTime(stopTime.time, to.time, context.reverse) &&
            isUsefulStopToExplore(stopTime.stop, context.goal)
        );
    });

    return candidateEndStopsOnTrip.map((stopTime) => {
        const timeOnSilverLineHere = isSilverLine ? Math.abs(stopTime.time - to.time) : 0;
        return {
            kind: "travel" as const,
            context,
            parents: [...parents, parent],
            from: to,
            to: stopTime,
            time: stopTime.time,
            boardedAtStations,
            boardedRoutePatternIds,
            boardedRegionalRailCount,
            timeOnSilverLine: timeOnSilverLine + timeOnSilverLineHere,
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
    const { fromStation, toStation, initialDayTime, unifiedFares, navigationKind } = options;
    const reverse = navigationKind === "arrive-by"
    console.log("hola amigo");
    console.log(navigationKind);
    console.log(reverse);
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
