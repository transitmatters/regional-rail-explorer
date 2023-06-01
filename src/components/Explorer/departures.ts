import { HOUR } from "time";
import { Duration, NetworkTime, TimeOfDay } from "types";

const centers: Record<TimeOfDay, NetworkTime> = {
    morning: HOUR * 8.5,
    midday: HOUR * 12,
    evening: HOUR * 18.5,
};

const getCandidateDepartureTimes = (
    arrivals: NetworkTime[],
    center: NetworkTime,
    halfInterval: Duration
) => {
    const boundedArrivals = arrivals.filter((t) => Math.abs(t - center) <= halfInterval);
    const candidates: number[] = [];
    for (let i = 0; i < boundedArrivals.length - 1; i++) {
        const first = boundedArrivals[i];
        const second = boundedArrivals[i + 1];
        candidates.push((first + second) / 2);
    }
    if (candidates.length < 2) {
        if (halfInterval < HOUR * 4) {
            return getCandidateDepartureTimes(arrivals, center, 2 * halfInterval);
        }
    }
    return candidates;
};

const getBestCandidateDepartureTime = (
    candidates: NetworkTime[],
    enhancedArrivals: NetworkTime[]
) => {
    let bestCandidate: null | number = null;
    let bestDifference = Infinity;
    if (candidates.length > 0) {
        candidates.forEach((candidate) => {
            const nextEnhancedArrival = enhancedArrivals.find((t) => t >= candidate)!;
            const difference = nextEnhancedArrival - candidate;
            if (difference < bestDifference) {
                bestDifference = difference;
                bestCandidate = candidate;
            }
        });
        return bestCandidate;
    }
    // if we don't have candidates from the baseline, we need to pick a time based on enhancedArrivals
    let firstArrival: null | number = null;
    let secondArrival: null | number = null;
    enhancedArrivals.forEach((arrival) => {
        if (arrival > 32400 && !firstArrival) {
            firstArrival = arrival;
        } else if (arrival > 32400 && firstArrival && !secondArrival) {
            secondArrival = arrival;
        }
    });
    if (firstArrival && secondArrival) {
        // return midpoint between first 2 arrivals after 9am
        return (firstArrival + secondArrival) / 2;
    }
    // if we still haven't found anything, default to 9am
    return 32400;
};

export const getAdvantageousDepartureTime = (
    timeOfDay: TimeOfDay,
    baselineArrivals: NetworkTime[],
    enhancedArrivals: NetworkTime[],
    halfInterval: Duration = HOUR * 0.75
): null | NetworkTime => {
    const center = centers[timeOfDay];
    const candidates = getCandidateDepartureTimes(baselineArrivals, center, halfInterval);
    return getBestCandidateDepartureTime(candidates, enhancedArrivals);
};
