import React from "react";

import { baseline as journey, walkBetweenStations, walkFromOrigin } from "storydata/journey";

import JourneyTimeline from "./JourneyTimeline";

export default {
    title: "JourneyTimeline",
    component: JourneyTimeline,
};

export const Default = () => <JourneyTimeline segments={journey} />;

export const WalkBetweenStations = () => <JourneyTimeline segments={walkBetweenStations} />;

export const WalkFromOrigin = () => <JourneyTimeline segments={walkFromOrigin} />;
