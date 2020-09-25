import { stringifyTime } from "time";

import { NavigationState } from "./types";

export const summarizeState = (state: NavigationState) => {
    const statesInRoute = [...state.parents, state];
    const firstStateInRoute = statesInRoute[0];
    const lastStateInRoute = statesInRoute[statesInRoute.length - 1];
    const route = statesInRoute
        .map((ns: NavigationState) => {
            if (ns.type === "start") {
                return ns.station.name;
            }
            return ns.stop.parentStation.name;
        })
        .join(" -> ");
    const elapsed = lastStateInRoute.dayTime.time - firstStateInRoute.dayTime.time;
    return `${route} ${stringifyTime(elapsed)}`;
};
