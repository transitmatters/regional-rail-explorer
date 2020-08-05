import React from "react";

import { journey } from "storydata/journey";

import JourneyTimeline from "./JourneyTimeline";

export default {
    title: "JourneyTimeline",
    component: JourneyTimeline,
};

export const Default = () => <JourneyTimeline journey={journey} />;
