import { Station, NetworkDayKind, Trip } from "types";
import { compareTimes, matchDayOfWeek } from "time";

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
