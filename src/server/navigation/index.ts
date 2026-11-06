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
        const arrivesAtDestination = finalSegment.kind === "travel" || !!finalSegment.walkToStation;
        if (arrivesAtDestination && waitDuration >= 5 * MINUTE) {
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
        const [firstSegment, ...rest] = journeySegments;
        if (firstSegment.kind !== "travel") {
            // Drop the wait before the first train, but keep a walk to the station it leaves from
            if (firstSegment.walkToStation) {
                const startTime = firstSegment.endTime - firstSegment.walkDuration;
                return [{ ...firstSegment, startTime, waitDuration: 0 }, ...rest];
            }
            return rest;
        }
    }
    return journeySegments;
};
