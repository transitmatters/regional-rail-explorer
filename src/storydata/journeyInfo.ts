import {
    JourneyInfo,
    CrowdingLevel,
    JourneyParams,
    JourneyTransferSegment,
    JourneyTravelSegment,
} from "types";
import { enhanced, baseline } from "storydata/journey";
import { enhancedArrivals, baselineArrivals } from "storydata/salem";

export const baselineInfo: JourneyInfo = {
    reverse: false,
    scenario: {
        id: "present",
        name: "Today's Commuter Rail",
    },
    segments: baseline,
    platformCrowding: {
        "place-ER-0168": {
            station: {
                name: "Salem",
                id: "place-ER-0168",
            },
            crowdingLevel: CrowdingLevel.High,
        },
    },
    arrivals: {
        "place-ER-0168": {
            station: {
                name: "Salem",
                id: "place-ER-0168",
            },
            times: baselineArrivals,
        },
    },
    amenities: [],
};

export const enhancedInfo: JourneyInfo = {
    reverse: false,
    scenario: {
        id: "regional_rail",
        name: "Regional Rail Phase 1",
    },
    segments: enhanced,
    platformCrowding: {
        "place-ER-0168": {
            station: {
                name: "Salem",
                id: "place-ER-0168",
            },
            crowdingLevel: CrowdingLevel.Low,
        },
    },
    arrivals: {
        "place-ER-0168": {
            station: {
                name: "Salem",
                id: "place-ER-0168",
            },
            times: enhancedArrivals,
        },
    },
    amenities: ["electricTrains", "levelBoarding", "increasedTopSpeed"],
};

export const journeyParams: JourneyParams = {
    fromStationId: "place-ER-0168",
    toStationId: "place-DB-2258",
    day: "weekday",
    time: 26100,
    reverse: false,
};
