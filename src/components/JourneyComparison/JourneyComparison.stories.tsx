import React from "react";

import { baseline, enhanced } from "storydata/journey";
import { enhancedArrivals, baselineArrivals } from "storydata/salem";
import { JourneyInfo, CrowdingLevel } from "types";

import JourneyComparison from "./JourneyComparison";

export default {
    title: "JourneyComparison",
    component: JourneyComparison,
};

const baselineInfo: JourneyInfo = {
    reverse: false,
    scenario: {
        id: "present-day",
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

const enhancedInfo: JourneyInfo = {
    reverse: false,
    scenario: {
        id: "phase-one",
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

export const Default = () => <JourneyComparison baseline={baselineInfo} enhanced={enhancedInfo} />;
