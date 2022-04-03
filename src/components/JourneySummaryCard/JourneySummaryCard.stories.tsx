import React from "react";

import { enhanced } from "storydata/journey";
import { enhancedArrivals } from "storydata/salem";
import { JourneyInfo, CrowdingLevel } from "types";
import JourneySummaryCard from "./JourneySummaryCard";

import JourneyComparison from "./JourneySummaryCard";

export default {
    title: "JourneySummaryCard",
    component: JourneyComparison,
};

const enhancedInfo: JourneyInfo = {
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

export const Default = () => <JourneySummaryCard day="saturday" journey={enhancedInfo} />;
