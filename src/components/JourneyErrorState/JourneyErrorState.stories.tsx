import React from "react";

import JourneyErrorState from "./JourneyErrorState";

export default {
    title: "JourneyErrorState",
    component: JourneyErrorState,
};

export const Default = () => <JourneyErrorState scenarioWithError={{id: "hmm", name: "Hmmmmm"}} />;
