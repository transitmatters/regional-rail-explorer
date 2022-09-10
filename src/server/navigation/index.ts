import { JourneySegment } from "types";
import { MINUTE } from "time";

import { navigateBetweenStations } from "./navigate";
import { createJourneyFromState } from "./journey";
import { NavigationOptions } from "./types";

export const navigate = (options: NavigationOptions): JourneySegment[] => {
    const { navigationKind, initialDayTime } = options;
    const finalNavigationState = navigateBetweenStations(options);
    if (navigationKind === "arrive-by") {
        const { day, time: originalEndTime } = initialDayTime;
        const reverseOptimizedJourney = navigate({
            ...options,
            navigationKind: "depart-at",
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
    const journeySegments = createJourneyFromState(finalNavigationState);
    if (navigationKind === "depart-after" && journeySegments.length > 0) {
        if (journeySegments[0].kind !== "travel") {
            return journeySegments.slice(1);
        }
    }
    return journeySegments;
};
