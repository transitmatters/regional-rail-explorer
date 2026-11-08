import {
    Journey,
    JourneyInfo,
    JourneyApiResult,
    JourneyStation,
    JourneyTravelSegment,
} from "types";

// Where a journey starts and ends, counting a walk from the origin or to the destination
export const getJourneyEndpoints = (
    journey: Journey
): { startStation: JourneyStation; endStation: JourneyStation } => {
    const travelSegments = journey.filter(
        (segment): segment is JourneyTravelSegment => segment.kind === "travel"
    );
    const firstSegment = journey[0];
    const lastSegment = journey[journey.length - 1];
    return {
        startStation:
            (firstSegment.kind === "transfer" && firstSegment.walkFromStation) ||
            travelSegments[0].startStation,
        endStation:
            (lastSegment.kind === "transfer" && lastSegment.walkToStation) ||
            travelSegments[travelSegments.length - 1].endStation,
    };
};

export const successfulJourneyApiResult = (result: JourneyApiResult): null | JourneyInfo[] => {
    if (result.some((entry) => "error" in entry)) {
        return null;
    }
    return result as JourneyInfo[];
};
