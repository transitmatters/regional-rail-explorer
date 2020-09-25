import { Station, NetworkDayKind } from "types";
import { compareTimes, matchDayOfWeek } from "time";

export const getArrivals = (origin: Station, goals: Station[], today: NetworkDayKind) => {
    return origin.stops
        .map((stop) =>
            stop.stopTimes
                .filter((originStopTime) => {
                    const { trip } = originStopTime;
                    const servesToday = trip.serviceDays.some((day) => matchDayOfWeek(day, today));
                    return (
                        servesToday &&
                        trip.stopTimes.some(
                            (stopOnSameTrip) =>
                                compareTimes(stopOnSameTrip.time, originStopTime.time) &&
                                goals.includes(stopOnSameTrip.stop.parentStation)
                        )
                    );
                })
                .map((usefulStopTime) => usefulStopTime.time)
        )
        .flat()
        .sort((a, b) => a - b);
};
