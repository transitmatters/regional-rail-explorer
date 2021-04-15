import { loadGtfsNetwork } from "server/network";

export type ApiError<P = any> = { error: true; payload: P };
export type ApiResult<T, P> = ApiError<P> | T;

export type Indexed<T> = { [key: string]: T };

export type Duration = number;

export interface GtfsRoute {
    routeId: string;
    routeLongName: string;
}
export interface GtfsTrip {
    routeId: string;
    routePatternId: string;
    tripId: string;
    serviceId: string;
    tripHeadsign: string;
    directionId: string;
}

export interface GtfsStopTime {
    stopId: string;
    tripId: string;
    arrivalTime: string;
}

export interface GtfsTransfer {
    fromStopId: string;
    toStopId: string;
    minWalkTime: string;
}

type BoolString = "0" | "1";
export interface GtfsService {
    serviceId: string;
    monday: BoolString;
    tuesday: BoolString;
    wednesday: BoolString;
    thursday: BoolString;
    friday: BoolString;
    saturday: BoolString;
    sunday: BoolString;
}

export interface GtfsStop {
    stopId: string;
    stopCode: string;
    stopName: string;
    stopDesc: string;
    locationType: string;
    platformCode: string;
    platformName: string;
    parentStation: string;
}

export interface StopTime {
    time: NetworkTime;
    stop: Stop;
    trip: Trip;
}

export interface Route {
    id: string;
    name: string;
}

export interface Trip {
    id: string;
    serviceId: string;
    routeId: string;
    routePatternId: string;
    directionId: string;
    serviceDays: NetworkDay[];
    stopTimes: StopTime[];
}

export interface Transfer {
    fromStop: Stop;
    toStop: Stop;
    minWalkTime: Duration;
}

export interface Stop {
    id: string;
    name: string;
    description: string;
    stopTimes: StopTime[];
    transfers: Transfer[];
    serviceIds: string[];
    routeIds: string[];
    parentStation: Station;
}

export interface Station {
    id: string;
    name: string;
    stops: Stop[];
}

export type Network = ReturnType<typeof loadGtfsNetwork>;
export interface Station {
    id: string;
    name: string;
    stops: Stop[];
}

export type NetworkDay =
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";

export type NetworkDayKind = "weekday" | "saturday" | "sunday";

export type NetworkTime = number;

export type NetworkTimeRange = [NetworkTime, NetworkTime];

export interface ScenarioInfo {
    id: string;
    name: string;
}

export interface Scenario extends ScenarioInfo {
    network: Network;
    amenitiesByRoute: Record<string, Amenity[]>;
    amenitiesByStation: Record<string, Amenity[]>;
}

export enum CrowdingLevel {
    Low = 1,
    Medium = 2,
    High = 3,
}

export type Amenity = "level-boarding" | "electric-trains" | "increased-top-speed";

export type TimeOfDay = "morning" | "midday" | "evening";

export interface NetworkDayTime {
    time: NetworkTime;
    day: NetworkDay | NetworkDayKind;
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
    type: "travel";
    departureTime: NetworkTime;
    arrivalTime: NetworkTime;
    fromStation: JourneyStation;
    toStation: JourneyStation;
    passedStations: {
        time: NetworkTime;
        station: JourneyStation;
    }[];
    routeId: string;
}

export interface JourneyTransferSegment {
    type: "transfer";
    startTime: NetworkTime;
    waitDuration: NetworkTime;
    transferDuration: NetworkTime;
}

export type JourneySegment = JourneyTransferSegment | JourneyTravelSegment;
export type Journey = JourneySegment[];

export interface JourneyInfo {
    scenario: ScenarioInfo;
    segments: JourneySegment[];
    amenities: Amenity[];
    arrivals: Record<string, { station: JourneyStation; times: NetworkTime[] }>;
    platformCrowding: Record<string, { station: JourneyStation; crowdingLevel: CrowdingLevel }>;
}

export type JourneyApiResult = ApiResult<JourneyInfo, { scenario: ScenarioInfo }>[];

export interface DepartureBoardEntry {
    time: NetworkTime;
    routeId: string;
    serviceId: string;
    destination: JourneyStation;
}

export interface SerializableStopTime {
    stationId: string;
    time: NetworkTime;
}

export interface SerializableTrip {
    id: string;
    directionId: string;
    routePatternId: string;
    stopTimes: SerializableStopTime[];
}

export interface BranchMap {
    routePatternIds: string[];
    stationIds: string[];
    branches?: BranchMap[];
}

export interface SerializableRouteInfo extends Route {
    stationNames: Record<string, string>;
    branchMap: BranchMap;
    weekdayTrips: SerializableTrip[];
}
