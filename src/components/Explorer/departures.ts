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
    candidates.forEach((candidate) => {
        const nextEnhancedArrival = enhancedArrivals.find((t) => t >= candidate)!;
        const difference = nextEnhancedArrival - candidate;
        if (difference < bestDifference) {
            bestDifference = difference;
            bestCandidate = candidate;
        }
    });
    return bestCandidate;
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
