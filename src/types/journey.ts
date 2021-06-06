import { AmenityName, ScenarioInfo } from "./model";
import { NetworkDayKind, NetworkTime } from "./time";

export enum CrowdingLevel {
    Low = 1,
    Medium = 2,
    High = 3,
}

export interface JourneyParams {
    fromStationId: string;
    toStationId: string;
    day: NetworkDayKind;
    time?: NetworkTime;
}

export interface JourneyStation {
    id: string;
    name: string;
}

export interface JourneyTravelSegment {
    kind: "travel";
    startTime: NetworkTime;
    endTime: NetworkTime;
    startStation: JourneyStation;
    endStation: JourneyStation;
    passedStations: {
        time: NetworkTime;
        station: JourneyStation;
    }[];
    routeId: string;
    routePatternId: string;
    levelBoarding: boolean;
}

export interface JourneyTransferSegment {
    kind: "transfer";
    startTime: NetworkTime;
    endTime: NetworkTime;
    waitDuration: NetworkTime;
    walkDuration: NetworkTime;
}

export type JourneySegment = JourneyTransferSegment | JourneyTravelSegment;
export type Journey = JourneySegment[];

export interface JourneyInfo {
    scenario: ScenarioInfo;
    segments: JourneySegment[];
    amenities: AmenityName[];
    arrivals: Record<string, { station: JourneyStation; times: NetworkTime[] }>;
    platformCrowding: Record<string, { station: JourneyStation; crowdingLevel: CrowdingLevel }>;
}