import { Station, NetworkDayTime, JourneySegment } from "types";
import { MINUTE } from "time";

import { navigateBetweenStations } from "./navigate";
import { createJourneyFromState } from "./journey";

export const navigate = (
    origin: Station,
    goal: Station,
    initialTime: NetworkDayTime,
    reverse: boolean = false
): JourneySegment[] => {
    const finalNavigationState = navigateBetweenStations(origin, goal, initialTime, reverse);
    if (reverse) {
        const { day, time: originalEndTime } = initialTime;
        const reverseOptimizedJourney = navigate(
            origin,
            goal,
            { day, time: finalNavigationState.time },
            false
        );
        const finalSegment = reverseOptimizedJourney[reverseOptimizedJourney.length - 1];
        const waitDuration = originalEndTime - finalSegment.endTime;
        if (finalSegment.kind === "travel" && waitDuration >= 5 * MINUTE) {
            return [
                ...reverseOptimizedJourney,
                {
                    kind: "transfer",
                    startTime: finalSegment.endTime,
                    endTime: originalEndTime,
                    waitDuration,
                    walkDuration: 0,
                },
            ];
        }
    }
    return createJourneyFromState(finalNavigationState);
};
