import { MINUTE } from "time";
import {
    JourneySegment,
    JourneyStation,
    JourneyTransferSegment,
    JourneyTravelSegment,
    NetworkTime,
    Station,
    Stop,
    Trip,
} from "types";

import {
    NavigationContext,
    NavigationState,
    StationWalk,
    TransferNavigationState,
    TravelNavigationState,
    WalkNavigationState,
} from "./types";
import { resolveTemporalOrder } from "./util";

const getStationInfo = ({ name, id }: Station): JourneyStation => ({ name, id });

const getJourneyStation = (stop: Stop): JourneyStation => getStationInfo(stop.parentStation);

const getWalkStations = (walk: null | StationWalk, context: NavigationContext) => {
    if (!walk) {
        return {};
    }
    const [from, to] = resolveTemporalOrder(walk.from, walk.to, context.reverse);
    return { walkFromStation: getStationInfo(from), walkToStation: getStationInfo(to) };
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
    const { from, to, context, walkDuration, walk } = state;
    const [startTime, endTime] = resolveTemporalOrder(
        // if the state lacks a 'from', assume it's the inital segment of the journey
        from?.time || context.initialTime,
        to.time,
        context.reverse
    );
    const totalDuration = endTime - startTime;
    const waitDuration = totalDuration - walkDuration;
    return {
        kind: "transfer",
        startTime,
        endTime,
        waitDuration,
        walkDuration,
        ...getWalkStations(walk, context),
    };
};

const createJourneyWalkSegment = (state: WalkNavigationState): JourneyTransferSegment => {
    const { fromTime, time, context, walkDuration, walk } = state;
    const [startTime, endTime] = resolveTemporalOrder(fromTime, time, context.reverse);
    return {
        kind: "transfer",
        startTime,
        endTime,
        waitDuration: 0,
        walkDuration,
        ...getWalkStations(walk, context),
    };
};

const createJourneyTravelSegment = (state: TravelNavigationState): JourneyTravelSegment => {
    const { from, to, context } = state;
    const [startStopTime, endStopTime] = resolveTemporalOrder(from, to, context.reverse);
    const { levelBoarding: startLevelBoarding } = startStopTime.stop;
    const { levelBoarding: endLevelBoarding } = endStopTime.stop;
    const { trip } = startStopTime;
    return {
        kind: "travel",
        levelBoarding: startLevelBoarding && endLevelBoarding,
        startTime: startStopTime.time,
        endTime: endStopTime.time,
        startStation: getJourneyStation(startStopTime.stop),
        endStation: getJourneyStation(endStopTime.stop),
        passedStations: getPassedJourneyStationsOnTrip(trip, startStopTime.time, endStopTime.time),
        routeId: trip.routeId,
        routePatternId: trip.routePatternId,
        directionId: trip.directionId,
    };
};

const createJourneySegmentFromState = (state: NavigationState): null | JourneySegment => {
    if (state.kind === "transfer") {
        return createJourneyTransferSegment(state);
    }
    if (state.kind === "travel") {
        return createJourneyTravelSegment(state);
    }
    if (state.kind === "walk") {
        return createJourneyWalkSegment(state);
    }
    return null;
};

export const createJourneyFromState = (finalState: NavigationState): JourneySegment[] => {
    const states = [...finalState.parents, finalState];
    let segments = states
        .map(createJourneySegmentFromState)
        .filter((x): x is JourneyTravelSegment => !!x);
    if (finalState.context.reverse) {
        segments = segments.reverse();
    }
    const [firstSegment] = segments;
    if (firstSegment.endTime - firstSegment.startTime < MINUTE) {
        return segments.slice(1);
    }
    return segments;
};
