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
    StationWalk,
    TransferNavigationState,
    TravelNavigationState,
    WalkNavigationState,
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
    // Among equally good states, explore the simpler journey first. Otherwise one with extra legs
    // that arrives at the same time can win, like riding a stop and walking further to a train
    // you could have walked to directly.
    return new Heap(
        (a: NavigationState, b: NavigationState) =>
            scoreState(a) - scoreState(b) || a.parents.length - b.parents.length
    );
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

// A station where some trips start or end while others pass through, so riders change trains
// there even on a single route. For example, many New Bedford trips are a South Station - Fall
// River train plus a shuttle from East Taunton to New Bedford.
const changePointCache = new WeakMap<Station, boolean>();

const isChangePoint = (station: Station) => {
    const cached = changePointCache.get(station);
    if (cached !== undefined) {
        return cached;
    }
    let hasEndpoint = false;
    let hasPassThrough = false;
    for (const stop of station.stops) {
        for (const stopTime of stop.stopTimes) {
            const { stopTimes } = stopTime.trip;
            if (stopTimes[0] === stopTime || stopTimes[stopTimes.length - 1] === stopTime) {
                hasEndpoint = true;
            } else {
                hasPassThrough = true;
            }
        }
    }
    const result = hasEndpoint && hasPassThrough;
    changePointCache.set(station, result);
    return result;
};

// Other stations that riders can walk to from this one, like Kenmore from Lansdowne, with the
// shortest walk to each. These come from GTFS transfers between stops of different stations.
const walkingNeighborsCache = new WeakMap<Station, Map<Station, Duration>>();

const getWalkingNeighbors = (station: Station) => {
    const cached = walkingNeighborsCache.get(station);
    if (cached) {
        return cached;
    }
    const neighbors = new Map<Station, Duration>();
    for (const stop of station.stops) {
        for (const transfer of stop.transfers) {
            const neighbor = transfer.toStop.parentStation;
            const shortestWalk = neighbors.get(neighbor);
            if (
                neighbor !== station &&
                (shortestWalk === undefined || transfer.walkTime < shortestWalk)
            ) {
                neighbors.set(neighbor, transfer.walkTime);
            }
        }
    }
    walkingNeighborsCache.set(station, neighbors);
    return neighbors;
};

const isUsefulStopToExplore = (stop: Stop, goal: Station) => {
    if (stop.parentStation === goal) {
        return true;
    }
    const uniqueRoutes = new Set(stop.parentStation.stops.map((stop) => stop.routes).flat());
    return (
        uniqueRoutes.size > 1 ||
        isChangePoint(stop.parentStation) ||
        getWalkingNeighbors(stop.parentStation).size > 0
    );
};

const isGoalState = (state: NavigationState) => {
    if (state.kind === "walk") {
        return true;
    }
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
    walkDuration: number,
    walk: null | StationWalk = null
): TransferNavigationState => {
    const {
        boardedAtStations,
        boardedRoutePatternIds,
        boardedRegionalRailCount: boardedRegionalRailCount,
        parents,
        context,
        timeOnSilverLine,
    } = parent;
    // Changing trains within one line doesn't need another ticket
    const boardingRegionalRail =
        isRegionalRailRouteId(stopTime.trip.routeId) &&
        from?.trip.routeId !== stopTime.trip.routeId;
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
        walk,
        timeOnSilverLine,
    };
};

const getNextVisitableStopTimes = (state: NavigationState, stop: Stop, now: NetworkTime) => {
    const { boardedAtStations, boardedRoutePatternIds, context } = state;
    const { reverse, today } = context;
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
            const fromStation = to.stop.parentStation;
            const toStation = transfer.toStop.parentStation;
            const walk = fromStation === toStation ? null : { from: fromStation, to: toStation };
            return visitableStopTimes.map((stopTime) => {
                return createTransferState(parent, stopTime, to, walkDuration, walk);
            });
        })
        .flat();
};

const getWalkToGoalStates = (parent: TravelNavigationState): WalkNavigationState[] => {
    const { context, time } = parent;
    // Searching backward, the goal is where the rider starts, and journeys always start there
    if (context.reverse) {
        return [];
    }
    const station = parent.to.stop.parentStation;
    const walkDuration = getWalkingNeighbors(station).get(context.goal);
    if (walkDuration === undefined) {
        return [];
    }
    return [
        {
            ...parent,
            kind: "walk" as const,
            parents: [...parent.parents, parent],
            walk: { from: station, to: context.goal },
            walkDuration,
            fromTime: time,
            time: displaceTime(time, walkDuration, context.reverse),
        },
    ];
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
    // Skip the stop where the rider boards. Riding nowhere would let a walk into the goal count as
    // the end of the search, which searching backward is a walk at the start of the journey.
    const candidateEndStopsOnTrip = to.trip.stopTimes.filter((stopTime) => {
        return (
            stopTime !== to &&
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
    const { origin, goal, initialTime, reverse } = context;
    const boardAtOrigin = origin.stops.flatMap((stop) => {
        const visitableStopTimes = getNextVisitableStopTimes(parent, stop, initialTime);
        return visitableStopTimes.map((stopTime) => {
            return createTransferState(parent, stopTime, null, 0);
        });
    });
    // Journeys always start at the rider's starting station. Searching backward, the search starts
    // from where the rider ends up, so they can walk there from a nearby station. Walking straight
    // to the goal isn't a journey on the network, so leave that out.
    if (!reverse) {
        return boardAtOrigin;
    }
    const walkThenBoard = [...getWalkingNeighbors(origin)]
        .filter(([neighbor]) => neighbor !== goal)
        .flatMap(([neighbor, walkDuration]) => {
            const now = displaceTime(initialTime, walkDuration, reverse);
            const walk = { from: origin, to: neighbor };
            return neighbor.stops.flatMap((stop) => {
                return getNextVisitableStopTimes(parent, stop, now).map((stopTime) => {
                    return createTransferState(parent, stopTime, null, walkDuration, walk);
                });
            });
        });
    return [...boardAtOrigin, ...walkThenBoard];
};

const getSuccessorStates = (state: NavigationState): NavigationState[] => {
    if (state.kind === "start") {
        return getTransferStatesFromStartState(state);
    }
    if (state.kind === "travel") {
        return [...getTransferStates(state), ...getWalkToGoalStates(state)];
    }
    if (state.kind === "walk") {
        return [];
    }
    return getTravelStates(state);
};

const getBestStatesFromHeap = (heap: Heap<NavigationState>): NavigationState[] => {
    const firstState = heap.pop() as NavigationState;
    const equallyGoodStates: NavigationState[] = [firstState];
    while (!heap.empty() && heap.peek()?.time === firstState.time) {
        equallyGoodStates.push(heap.pop() as NavigationState);
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
        if (state.kind === "walk") {
            console.log(time, "walk", state.walk.from.name, "->", state.walk.to.name);
        }
    });
};

export const navigateBetweenStations = (options: NavigationOptions) => {
    const { fromStation, toStation, initialDayTime, unifiedFares, navigationKind } = options;
    const reverse = navigationKind === "arrive-by";
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
