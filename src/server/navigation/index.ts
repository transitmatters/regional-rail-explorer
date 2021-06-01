import { Station, NetworkDayTime, JourneySegment } from "types";

import { navigateBetweenStations } from "./navigate";
import { createJourneyFromState } from "./journey";

export const navigate = (
    origin: Station,
    goal: Station,
    initialTime: NetworkDayTime,
    backwards: boolean
): JourneySegment[] => {
    const finalNavigationState = navigateBetweenStations(origin, goal, initialTime, backwards);
    return createJourneyFromState(finalNavigationState);
};
