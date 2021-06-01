import React from "react";

import SuggestedJourneys from "./SuggestedJourneys";

export default {
    title: "SuggestedJourneys",
    component: SuggestedJourneys,
};

export const Default = () => {
    return <SuggestedJourneys journey1 = {{ origin: "Route 128", destination: "Back Bay"}} />
};