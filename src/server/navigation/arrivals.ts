import {
    Station,
    NetworkDayKind,
    Trip,
    JourneyParams,
    ArrivalsInfo,
    JourneySegment,
    JourneyTravelSegment,
} from "types";
import { compareTimes, matchDayOfWeek, parseTime } from "time";
import { mapScenarios } from "server/scenarios";
import { getStationsByIds } from "server/network";
import { navigate } from ".";
import { isRegionalRailRouteId } from "routes";

type ArrivalJourneyParams = Pick<JourneyParams, "fromStationId" | "toStationId" | "day">;

const tripIsToday = (trip: Trip, today: NetworkDayKind) =>
    trip.serviceDays.some((day) => matchDayOfWeek(day, today));

const shouldShowArrivalTimes = (journey: null | JourneySegment[]) => {
    if (journey) {
        const firstTravelSegment = journey.find((s) => s.kind === "travel") as JourneyTravelSegment;
        return isRegionalRailRouteId(firstTravelSegment.routeId);
    }
    return false;
};

export const getArrivalTimesForJourney = (
    origin: Station,
    goals: Station[],
    today: NetworkDayKind
) => {
    const arrivals = origin.stops
        .map((stop) =>
            stop.stopTimes
                .filter((originStopTime) => {
                    const { trip } = originStopTime;
                    return (
                        tripIsToday(trip, today) &&
                        trip.stopTimes.some(
                            (stopOnSameTrip) =>
                                compareTimes(stopOnSameTrip.time, originStopTime.time) > 0 &&
                                goals.includes(stopOnSameTrip.stop.parentStation)
                        )
                    );
                })
                .map((usefulStopTime) => usefulStopTime.time)
        )
        .flat()
        .sort((a, b) => a - b);
    return [...new Set(arrivals)];
};

export const getStopTimesAtStation = (station: Station, today: NetworkDayKind) => {
    return station.stops
        .map((stop) => stop.stopTimes.filter((st) => tripIsToday(st.trip, today)))
        .flat();
};

export const getArrivalsInfo = (journeyParams: ArrivalJourneyParams): ArrivalsInfo => {
    const { fromStationId, toStationId, day } = journeyParams;
    const [
        { arrivals: baselineArrivals, journey: baselineJourney },
        { arrivals: enhancedArrivals, journey: enhancedJourney },
    ] = mapScenarios(
        ({ network, unifiedFares }) => {
            const [fromStation, toStation] = getStationsByIds(network, fromStationId, toStationId);
            const journey = navigate({
                fromStation,
                toStation,
                unifiedFares,
                initialDayTime: {
                    time: parseTime("09:00"),
                    day,
                },
            });
            const toStationIds = journey
                .map((seg) => seg.kind === "travel" && seg.endStation.id)
                .filter((x): x is string => !!x);
            const toStations = getStationsByIds(network, ...toStationIds);
            const arrivals = getArrivalTimesForJourney(fromStation, toStations, day);
            return { arrivals, journey };
        },
        () => ({ arrivals: [] as number[], journey: null })
    );
    const showArrivals = [baselineJourney, enhancedJourney].every(shouldShowArrivalTimes);
    return { baselineArrivals, enhancedArrivals, showArrivals };
};
