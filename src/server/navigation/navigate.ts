import Heap from "heap";

import { Stop, NetworkDayTime, Station, Transfer, StopTime, NetworkTime } from "types";
import { compareTimes, stringifyTime, matchDayOfWeek } from "time";
import { NavigationFailedError } from "errors";

import { NavigationState, StopNavigationState } from "./types";

const isSuccessorTime = (first: NetworkTime, second: NetworkTime, backwards: boolean) => {
    const comparison = compareTimes(first, second);
    return backwards ? comparison <= 0 : comparison >= 0;
};

const isStopTimeToday = (stopTime: StopTime, searchTime: NetworkDayTime) => {
    return stopTime.trip.serviceDays.some((day) => matchDayOfWeek(day, searchTime.day));
};

const isUsefulStopToExplore = (stop: Stop, goal: Station) => {
    return (
        stop.parentStation === goal ||
        stop.parentStation.stops.map((stop) => stop.routeIds.length).flat().length > 1
    );
};

const isRegionalRailTerminus = (station: Station) => {
    return station.id === "place-north" || station.id === "place-sstat";
};

const resolveBoardingAndAlightingStopTimes = (
    predecessor: StopTime,
    successor: StopTime,
    backwards: boolean
) => {
    if (backwards) {
        return {
            boarding: successor,
            alighting: predecessor,
        };
    }
    return {
        boarding: predecessor,
        alighting: successor,
    };
};

const getTransferTime = (
    dayTime: NetworkDayTime,
    backwards: boolean,
    transfer: null | Transfer
) => {
    const multiplier = backwards ? -1 : 1;
    return {
        day: dayTime.day,
        time: dayTime.time + multiplier * (transfer ? transfer.minWalkTime : 0),
    };
};

const getSuccessorStatesFromStop = (
    state: NavigationState,
    location: Stop,
    dayTime: NetworkDayTime,
    goal: Station,
    backwards: boolean,
    fromTransfer: null | Transfer = null
): StopNavigationState[] => {
    const { seen, parents, seenRoutePatternIds } = state;
    const { stopTimes } = location;
    const searchTime = getTransferTime(dayTime, backwards, fromTransfer);

    const boardableStopTimes = stopTimes.filter((stopTime) => {
        return (
            isStopTimeToday(stopTime, searchTime) &&
            isSuccessorTime(stopTime.time, searchTime.time, backwards) &&
            !seenRoutePatternIds.has(stopTime.trip.routePatternId)
        );
    });

    const nextStopTimeForEachServiceAndDirection = ["0", "1"]
        .map((directionId) =>
            location.routeIds.map((routeId) =>
                boardableStopTimes.find(
                    (stopTime) =>
                        stopTime.trip.routeId === routeId &&
                        stopTime.trip.directionId === directionId
                )
            )
        )
        .flat()
        .filter((x): x is StopTime => !!x);

    return nextStopTimeForEachServiceAndDirection
        .map((currentStopTime) => {
            const { trip, time } = currentStopTime;
            const validStopsTimesOnTrip = trip.stopTimes.filter((stopOnSameTrip) => {
                const isSuccessor = isSuccessorTime(stopOnSameTrip.time, time, backwards);
                const isUsefulStop = isUsefulStopToExplore(stopOnSameTrip.stop, goal);
                return isSuccessor && isUsefulStop && !seen.has(stopOnSameTrip.stop);
            });
            return validStopsTimesOnTrip.map((successorStopTime) => {
                const { boarding, alighting } = resolveBoardingAndAlightingStopTimes(
                    currentStopTime,
                    successorStopTime,
                    backwards
                );
                return {
                    fromTransfer,
                    type: "stop" as const,
                    previousStop: boarding.stop,
                    stop: alighting.stop,
                    trip: trip,
                    seen: new Set([...seen, successorStopTime.stop]),
                    seenRoutePatternIds: new Set([...seenRoutePatternIds, trip.routePatternId]),
                    parents: [...parents, state],
                    boardingTime: boarding.time,
                    alightingTime: alighting.time,
                    dayTime: {
                        day: dayTime.day,
                        time: successorStopTime.time,
                    },
                };
            });
        })
        .flat();
};

const getSuccessorStates = (
    state: NavigationState,
    goal: Station,
    backwards: boolean
): NavigationState[] => {
    const { dayTime } = state;
    if (state.type === "start") {
        const { station } = state;
        return station.stops
            .map((stop) => getSuccessorStatesFromStop(state, stop, dayTime, goal, backwards))
            .flat();
    }
    if (state.type === "stop") {
        const { stop } = state;
        const fromSameStop = isRegionalRailTerminus(stop.parentStation)
            ? getSuccessorStatesFromStop(state, stop, dayTime, goal, backwards)
            : [];
        const fromTransfer = stop.transfers
            .map((tr) => getSuccessorStatesFromStop(state, tr.toStop, dayTime, goal, backwards, tr))
            .flat();
        return [...fromSameStop, ...fromTransfer];
    }
    throw new Error("In navigation: Invalid state.type");
};

const createInitialState = (station: Station, dayTime: NetworkDayTime): NavigationState => {
    return {
        type: "start",
        seen: new Set(),
        seenRoutePatternIds: new Set(),
        station: station,
        dayTime: dayTime,
        parents: [],
    };
};

const getBestStatesFromHeap = (heap: any): NavigationState[] => {
    const firstState = heap.pop();
    const equallyGoodStates: NavigationState[] = [firstState];
    while (!heap.empty() && heap.peek().dayTime.time === firstState.dayTime.time) {
        equallyGoodStates.push(heap.pop());
    }
    return equallyGoodStates.sort((a, b) => a.parents.length - b.parents.length);
};

const printTripFromState = (navState: NavigationState) => {
    [...navState.parents, navState].forEach((state) => {
        console.log(
            stringifyTime(state.dayTime.time),
            state.type === "start"
                ? state.station.name
                : [state.stop.parentStation.name, state.trip.serviceId, state.trip.id].join(" ")
        );
    });
};

export const navigateBetweenStations = (
    origin: Station,
    goal: Station,
    initialTime: NetworkDayTime,
    backwards: boolean = false
) => {
    const initialState = createInitialState(origin, initialTime);
    const stateHeap: Heap<NavigationState> = new Heap((a, b) => a.dayTime.time - b.dayTime.time);
    const visited = new Set<Station>([origin]);
    stateHeap.push(initialState);
    while (!stateHeap.empty()) {
        const nextBestStates = getBestStatesFromHeap(stateHeap);
        for (const state of nextBestStates) {
            // console.log(summarizeState(state));
            if (state.type === "stop") {
                visited.add(state.stop.parentStation);
            }
            if (state.type === "stop" && state.stop.parentStation === goal) {
                printTripFromState(state);
                return state;
            }
            getSuccessorStates(state, goal, backwards)
                .filter((state) => state.type === "start" || !visited.has(state.stop.parentStation))
                .forEach((newState) => stateHeap.push(newState));
        }
    }
    throw new NavigationFailedError();
};
