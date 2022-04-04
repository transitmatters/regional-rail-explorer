import React from "react";

import { baselineInfo, enhancedInfo } from "storydata/journeyInfo";

import JourneyComparison from "./JourneyComparison";

export default {
    title: "JourneyComparison",
    component: JourneyComparison,
};

export const Default = () => <JourneyComparison baseline={baselineInfo} enhanced={enhancedInfo} />;
