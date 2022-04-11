import React from "react";

import { baseline as journey } from "storydata/journey";

import JourneyTimeline from "./JourneyTimeline";

export default {
    title: "JourneyTimeline",
    component: JourneyTimeline,
};

export const Default = () => <JourneyTimeline segments={journey} />;
