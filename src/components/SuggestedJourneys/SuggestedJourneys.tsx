import React from "react";
import { stationsById } from "stations";
import { JourneyParams } from "types";

import styles from "./SuggestedJourneys.module.scss";


type Props = { 
    journeys: JourneyParams[];
}

export function getJourneyUrl(journey: JourneyParams) {
    return `/?from=${journey["fromStationId"]}&to=${journey["toStationId"]}&day=${journey["day"]}&time=${journey["time"]}`;
}

const SuggestedJourneys = (props: Props) => {
    const { journeys } = props;
    let divArr = [] as any;
    for (let i = 0; i < journeys.length; ++i) {
        divArr.push(
            <div className={styles.journey}> 
                 <a href={getJourneyUrl(journeys[i])}>
                 <h2>Journey Option {i + 1}:</h2>
                 <p>Depart from: { stationsById[journeys[i]["fromStationName"]].name }</p>
                 <p>Arrive at: { stationsById[journeys[i]["toStationName"]].name }</p></a>
             </div>
        );
    } 
    return divArr;
};

export default SuggestedJourneys; ok