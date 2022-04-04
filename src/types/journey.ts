import { AmenityName } from "./model";
import { NetworkDayKind, NetworkTime } from "./time";
import { ScenarioInfo } from "./scenario";

export enum CrowdingLevel {
    Low = 1,
    Medium = 2,
    High = 3,
}

export interface JourneyParams {
    fromStationId: string;
    toStationId: string;
    day: NetworkDayKind;
    time: NetworkTime;
    reverse: boolean;
}

export type ParsedJourneyParams = Partial<JourneyParams> & { reverse: boolean };

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
    isWaitAtDestination?: boolean;
}

export type JourneySegment = JourneyTransferSegment | JourneyTravelSegment;
export type Journey = JourneySegment[];

export interface JourneyInfo {
    scenario: ScenarioInfo;
    segments: JourneySegment[];
    amenities: AmenityName[];
    arrivals: Record<string, { station: JourneyStation; times: NetworkTime[] }>;
    platformCrowding: Record<string, { station: JourneyStation; crowdingLevel: CrowdingLevel }>;
    reverse: boolean;
}
