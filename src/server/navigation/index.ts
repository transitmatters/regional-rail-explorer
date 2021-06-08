import { Station, NetworkDayTime, JourneySegment } from "types";

import { navigateBetweenStations } from "./navigate";
import { createJourneyFromState } from "./journey";

export const navigate = (
    origin: Station,
    goal: Station,
    initialTime: NetworkDayTime,
    reverse: boolean = false
): JourneySegment[] => {
    const finalNavigationState = navigateBetweenStations(origin, goal, initialTime, reverse);
    return createJourneyFromState(finalNavigationState);
};
