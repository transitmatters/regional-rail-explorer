import {
    JourneySegment,
    JourneyStation,
    JourneyTransferSegment,
    JourneyTravelSegment,
    NetworkTime,
    Stop,
    Trip,
} from "types";
import { NavigationState, TransferNavigationState, TravelNavigationState } from "./types";
import { resolveTemporalOrder } from "./util";

const getJourneyStation = (stop: Stop): JourneyStation => {
    const { name, id } = stop.parentStation;
    return { name, id };
};

const getPassedJourneyStationsOnTrip = (
    trip: Trip,
    startTime: NetworkTime,
    endTime: NetworkTime
) => {
    return trip.stopTimes
        .filter(({ time }) => time > startTime && time < endTime)
        .map(({ time, stop }) => {
            return {
                time: time,
                station: getJourneyStation(stop),
            };
        });
};

const createJourneyTransferSegment = (state: TransferNavigationState): JourneyTransferSegment => {
    const { from, to, context, walkDuration } = state;
    const [startTime, endTime] = resolveTemporalOrder(
        // if the state lacks a 'from', assume it's the inital segment of the journey
        from?.time || context.initialTime,
        to.time,
        context.backwards
    );
    const totalDuration = endTime - startTime;
    const waitDuration = totalDuration - walkDuration;
    return {
        kind: "transfer",
        startTime,
        endTime,
        waitDuration,
        walkDuration,
    };
};

const createJourneyTravelSegment = (state: TravelNavigationState): JourneyTravelSegment => {
    const { from, to, context } = state;
    const [startStopTime, endStopTime] = resolveTemporalOrder(from, to, context.backwards);
    const { levelBoarding } = startStopTime.stop;
    const { trip } = startStopTime;
    return {
        kind: "travel",
        levelBoarding,
        startTime: startStopTime.time,
        endTime: endStopTime.time,
        startStation: getJourneyStation(startStopTime.stop),
        endStation: getJourneyStation(endStopTime.stop),
        passedStations: getPassedJourneyStationsOnTrip(trip, startStopTime.time, endStopTime.time),
        routeId: trip.routeId,
        routePatternId: trip.routePatternId,
    };
};

const createJourneySegmentFromState = (state: NavigationState): null | JourneySegment => {
    if (state.kind === "transfer") {
        return createJourneyTransferSegment(state);
    }
    if (state.kind === "travel") {
        return createJourneyTravelSegment(state);
    }
    return null;
};

export const createJourneyFromState = (finalState: NavigationState): JourneySegment[] => {
    const states = [...finalState.parents, finalState];
    const segments = states
        .map(createJourneySegmentFromState)
        .filter((x): x is JourneyTravelSegment => !!x);
    if (finalState.context.backwards) {
        return segments.reverse();
    }
    return segments;
};
