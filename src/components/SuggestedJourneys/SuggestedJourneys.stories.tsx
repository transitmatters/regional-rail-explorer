import React from "react";
import { JourneyParams } from "types";

import SuggestedJourneys from "./SuggestedJourneys";

export default {
    title: "SuggestedJourneys",
    component: SuggestedJourneys,
};

const journeyParams1: JourneyParams = {
    fromStationId: "place-NEC-2173",
    toStationId: "place-bbsta",
    day: "weekday",
    time: 32010,
};

const journeyParams2: JourneyParams = {
    fromStationId: "place-DB-2222",
    toStationId: "place-sstat",
    day: "weekday",
    time: 51300,
};

const journeyParams3: JourneyParams = {
    fromStationId: "place-KB-0351",
    toStationId: "place-PB-0356",
    day: "weekday",
    time: 73358,
};

const journey = [journeyParams1, journeyParams2, journeyParams3];

export const Default = () => {
    return <SuggestedJourneys journeys={journey} />;
};
