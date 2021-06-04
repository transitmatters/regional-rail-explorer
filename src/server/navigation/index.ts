import { Station, NetworkDayTime, JourneySegment } from "types";

import { navigateBetweenStations } from "./navigate";
import { navigateBetweenStationsAgain } from "./navigate_again";
import { createJourneyFromState } from "./journey";

export const navigate = (
    origin: Station,
    goal: Station,
    initialTime: NetworkDayTime,
    backwards: boolean
): JourneySegment[] => {
    const ooof = navigateBetweenStationsAgain(origin, goal, initialTime, backwards);
    console.log(ooof.parents.map((s) => s.kind));
    const finalNavigationState = navigateBetweenStations(origin, goal, initialTime, backwards);
    return createJourneyFromState(finalNavigationState);
};
