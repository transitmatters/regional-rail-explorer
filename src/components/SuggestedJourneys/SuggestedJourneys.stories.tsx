import React from "react";
import { JourneyParams } from "types";

import SuggestedJourneys from "./SuggestedJourneys";


export default {
    title: "SuggestedJourneys",
    component: SuggestedJourneys,
};

const journeyParams1: JourneyParams = { fromStationId: "place-NEC-2173", toStationId: "place-bbsta",
                                        day: "weekday", time: 32010};
const journeyParams2: JourneyParams = { fromStationId: "place-DB-2222", toStationId: "place-sstat",
                                        day: "weekday", time: 32010};

// const journeyQueue: journeyMap = [
//     {
//         params: journeyParams1,
//         fromStationName: "Route 128",
//         toStationName: "Back Bay",
//     },
//     {
//         params: journeyParams2,
//         fromStationName: "Blue Hill Avenue",
//         toStationName: "South Station",
//     }
// ]
const journey = [
    {
        params: journeyParams1,
        fromStationName: "Route 128", 
        toStationName: "Back Bay"
    },
    {
        params: journeyParams2,
        fromStationName: "Blue Hill Avenue", 
        toStationName: "South Station"
    }
];



export const Default = () => {
    return <SuggestedJourneys journeys = { journey } />
};