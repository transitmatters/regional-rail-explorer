import React from "react";

import { JourneyInfo, CrowdingLevel } from "types";
import { baseline, enhanced } from "storydata/journey";

import JourneyComparison from "./JourneyComparison";

export default {
    title: "JourneyComparison",
    component: JourneyComparison,
};

const baselineInfo: JourneyInfo = {
    scenario: {
        name: "Baseline",
    },
    segments: baseline,
    platformCrowding: [
        {
            stationName: "Salem",
            crowdingLevel: CrowdingLevel.High,
        },
    ],
    amenities: [],
};

const enhancedInfo: JourneyInfo = {
    scenario: {
        name: "Baseline",
    },
    segments: enhanced,
    platformCrowding: [
        {
            stationName: "Salem",
            crowdingLevel: CrowdingLevel.Medium,
        },
    ],
    amenities: ["electric-trains", "level-boarding", "increased-top-speed"],
};

export const Default = () => <JourneyComparison baseline={baselineInfo} enhanced={enhancedInfo} />;
