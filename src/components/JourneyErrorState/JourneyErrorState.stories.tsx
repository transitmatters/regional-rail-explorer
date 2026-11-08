import React from "react";

import JourneyErrorState from "./JourneyErrorState";

export default {
    title: "JourneyErrorState",
    component: JourneyErrorState,
};

export const Default = () => <JourneyErrorState />;

export const NoRoute = () => (
    <JourneyErrorState
        kind="noTrain"
        title="No train for this trip"
        message="Neither today's Commuter Rail nor Regional Rail runs a train for this trip at this time. Try a different time or day."
    />
);
