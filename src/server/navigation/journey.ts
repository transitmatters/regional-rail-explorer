import {
    Station,
    Trip,
    JourneyStation,
    JourneyTravelSegment,
    JourneyTransferSegment,
    JourneySegment,
    NetworkTime,
} from "types";

import { NavigationState, StopNavigationState } from "./types";

const getJourneyStation = (station: Station): JourneyStation => {
    const { name, id } = station;
    return { name, id };
};

const getPassedJourneyStationsOnTrip = (
    trip: Trip,
    afterTime: NetworkTime,
    beforeTime: NetworkTime
) => {
    return trip.stopTimes
        .filter(({ time }) => time > afterTime && time < beforeTime)
        .map(({ time, stop }) => {
            return {
                time: time,
                station: getJourneyStation(stop.parentStation),
            };
        });
};

const getTransferSegment = (
    state: NavigationState,
    nextState: StopNavigationState
): JourneyTransferSegment => {
    if (state.type === "start") {
        return {
            kind: "transfer",
            startTime: state.dayTime.time,
            waitDuration: nextState.boardingTime - state.dayTime.time,
            walkDuration: 0,
        };
    } else {
        const { boardingTime, alightingTime, fromTransfer } = nextState;
        const totalInStationDuration = boardingTime - state.alightingTime;
        const walkDuration = (fromTransfer && fromTransfer.minWalkTime) || 0;
        return {
            kind: "transfer",
            startTime: alightingTime,
            walkDuration,
            waitDuration: totalInStationDuration - walkDuration,
        };
    }
};

const getTravelSegment = (
    state: NavigationState,
    nextState: StopNavigationState
): JourneyTravelSegment => {
    const { boardingTime, alightingTime, trip, stop, previousStop } = nextState;
    const { levelBoarding } = previousStop;
    const fromStation = state.type === "start" ? state.station : state.stop.parentStation;
    const toStation = stop.parentStation;
    return {
        kind: "travel",
        levelBoarding,
        departureTime: boardingTime,
        arrivalTime: alightingTime,
        startStation: getJourneyStation(fromStation),
        endStation: getJourneyStation(toStation),
        passedStations: getPassedJourneyStationsOnTrip(trip, boardingTime, alightingTime),
        routeId: nextState.trip.routeId,
        routePatternId: nextState.trip.routePatternId,
    };
};

export const createJourneyFromState = (finalState: NavigationState): JourneySegment[] => {
    const states = [...finalState.parents, finalState];
    const segments: JourneySegment[] = [];
    for (let i = 0; i < states.length - 1; i++) {
        const state = states[i];
        const nextState = states[i + 1] as StopNavigationState;
        segments.push(getTransferSegment(state, nextState));
        segments.push(getTravelSegment(state, nextState));
    }
    return segments;
};
