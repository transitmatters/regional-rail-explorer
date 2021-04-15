import { ApiResult, JourneyApiResult, JourneyInfo, NetworkDayKind, NetworkTime } from "types";

const apiFetch = (route, params) => {
    const urlParams = new URLSearchParams(params);
    return fetch(`/api/${route}?${urlParams.toString()}`).then((res) => res.json());
};

export const arrivals = (
    fromStationId: string,
    toStationId: string,
    day: NetworkDayKind,
    scenarioNames: string[]
) => {
    return apiFetch("arrivals", {
        fromStationId,
        toStationId,
        day,
        scenarioNames: scenarioNames.join(","),
    });
};

export const journeys = (
    fromStationId: string,
    toStationId: string,
    day: NetworkDayKind,
    time: NetworkTime,
    scenarioNames: string[]
): Promise<JourneyApiResult> => {
    return apiFetch("journeys", {
        fromStationId,
        toStationId,
        day,
        time,
        scenarioNames: scenarioNames.join(","),
    });
};
