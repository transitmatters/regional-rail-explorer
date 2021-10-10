import { JourneySegment } from "types";
import { MINUTE } from "time";

import { navigateBetweenStations } from "./navigate";
import { createJourneyFromState } from "./journey";
import { NavigationOptions } from "./types";

export const navigate = (options: NavigationOptions): JourneySegment[] => {
    const { reverse, initialDayTime } = options;
    const finalNavigationState = navigateBetweenStations(options);
    if (reverse) {
        const { day, time: originalEndTime } = initialDayTime;
        const reverseOptimizedJourney = navigate({
            ...options,
            reverse: false,
            initialDayTime: { day, time: finalNavigationState.time },
        });
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
                    isWaitAtDestination: true,
                },
            ];
        }
    }
    return createJourneyFromState(finalNavigationState);
};
