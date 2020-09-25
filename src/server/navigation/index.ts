import { Station, NetworkDayTime, JourneySegment } from "types";

import { navigateBetweenStations } from "./navigate";
import { createJourneyFromState } from "./journey";

export const navigate = (
    origin: Station,
    goal: Station,
    startTime: NetworkDayTime
): JourneySegment[] => {
    const finalNavigationState = navigateBetweenStations(origin, goal, startTime);
    return createJourneyFromState(finalNavigationState);
};
