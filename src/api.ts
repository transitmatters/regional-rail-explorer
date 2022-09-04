import { JourneyApiResult, NetworkDayKind, NetworkTime } from "types";

const apiFetch = (route: string, params: Record<string, string>) => {
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
    navigationKind: string,
    scenarioNames: string[]
): Promise<JourneyApiResult> => {
    return apiFetch("journeys", {
        fromStationId,
        toStationId,
        day,
        time: time.toString(),
        scenarioNames: scenarioNames.join(","),
        navigationKind,
    });
};
