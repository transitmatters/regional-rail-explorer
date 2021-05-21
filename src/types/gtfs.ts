type BoolishNumString = "0" | "1";

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

export interface GtfsService {
    serviceId: string;
    monday: BoolishNumString;
    tuesday: BoolishNumString;
    wednesday: BoolishNumString;
    thursday: BoolishNumString;
    friday: BoolishNumString;
    saturday: BoolishNumString;
    sunday: BoolishNumString;
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
    wheelchairBoarding: BoolishNumString;
}

export interface GtfsRoutePatternAmenities {
    routePatternId: string;
    electricTrains: boolean;
    levelBoarding: boolean;
    increasedTopSpeed: boolean;
}
