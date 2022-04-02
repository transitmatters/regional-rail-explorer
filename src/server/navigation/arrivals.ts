import { Station, NetworkDayKind, Trip, JourneyParams } from "types";
import { compareTimes, matchDayOfWeek, parseTime } from "time";
import { mapScenarios } from "server/scenarios";
import { getStationsByIds } from "server/network";
import { navigate } from ".";

type ArrivalJourneyParams = Pick<JourneyParams, "fromStationId" | "toStationId" | "day">;

const tripIsToday = (trip: Trip, today: NetworkDayKind) =>
    trip.serviceDays.some((day) => matchDayOfWeek(day, today));

export const getArrivalTimesForJourney = (
    origin: Station,
    goals: Station[],
    today: NetworkDayKind
) => {
    return origin.stops
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
};

export const getStopTimesAtStation = (station: Station, today: NetworkDayKind) => {
    return station.stops
        .map((stop) => stop.stopTimes.filter((st) => tripIsToday(st.trip, today)))
        .flat();
};

export const getArrivalTimes = (journeyParams: ArrivalJourneyParams) => {
    const { fromStationId, toStationId, day } = journeyParams;
    return mapScenarios(
        ({ network, unifiedFares }) => {
            const [fromStation, toStation] = getStationsByIds(network, fromStationId, toStationId);
            const exemplarJourney = navigate({
                fromStation,
                toStation,
                unifiedFares,
                initialDayTime: {
                    time: parseTime("09:00"),
                    day,
                },
            });
            const toStationIds = exemplarJourney
                .map((seg) => seg.kind === "travel" && seg.endStation.id)
                .filter((x): x is string => !!x);
            const toStations = getStationsByIds(network, ...toStationIds);
            return getArrivalTimesForJourney(fromStation, toStations, day);
        },
        () => [] as number[]
    );
};
