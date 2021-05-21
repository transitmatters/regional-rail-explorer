import {
    NetworkDayTime,
    Station,
    Trip,
    JourneyStation,
    JourneyTravelSegment,
    JourneyTransferSegment,
    JourneySegment,
} from "types";

import { NavigationState, StopNavigationState } from "./types";

const getJourneyStation = (station: Station): JourneyStation => {
    const { name, id } = station;
    return { name, id };
};

const getPassedJourneyStationsOnTrip = (
    trip: Trip,
    afterDayTime: NetworkDayTime,
    beforeDayTime: NetworkDayTime
) => {
    const { time: afterTime } = afterDayTime;
    const { time: beforeTime } = beforeDayTime;
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
            type: "transfer",
            startTime: state.dayTime.time,
            waitDuration: nextState.departPreviousStopTime.time - state.dayTime.time,
            transferDuration: 0,
        };
    } else {
        const { departPreviousStopTime, fromTransfer } = nextState;
        const totalInStationDuration =
            departPreviousStopTime.time - state.arriveAtThisStopTime.time;
        const transferDuration = (fromTransfer && fromTransfer.minWalkTime) || 0;
        return {
            type: "transfer",
            startTime: state.arriveAtThisStopTime.time,
            transferDuration: transferDuration,
            waitDuration: totalInStationDuration - transferDuration,
        };
    }
};

const getTravelSegment = (
    state: NavigationState,
    nextState: StopNavigationState
): JourneyTravelSegment => {
    const { departPreviousStopTime, arriveAtThisStopTime, trip, stop } = nextState;
    const fromStation = state.type === "start" ? state.station : state.stop.parentStation;
    const toStation = stop.parentStation;
    return {
        type: "travel",
        departureTime: departPreviousStopTime.time,
        arrivalTime: arriveAtThisStopTime.time,
        fromStation: getJourneyStation(fromStation),
        toStation: getJourneyStation(toStation),
        passedStations: getPassedJourneyStationsOnTrip(
            trip,
            departPreviousStopTime,
            arriveAtThisStopTime
        ),
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
