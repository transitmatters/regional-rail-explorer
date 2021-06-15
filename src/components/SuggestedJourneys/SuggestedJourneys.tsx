import React from "react";
import { stationsById } from "stations";
import { JourneyParams } from "types";

import styles from "./SuggestedJourneys.module.scss";

type Props = {
    journeys: JourneyParams[];
};

export function getJourneyUrl(journey: JourneyParams) {
    return `/?from=${journey["fromStationId"]}&to=${journey["toStationId"]}&day=${journey["day"]}&time=${journey["time"]}`;
}

function getClass(time: JourneyParams) {
    const times = time["time"];
    if (times === undefined) {
        return styles.midday;
    } else if (times >= 18000 && times <= 39600) {
        return styles.morning;
    } else if (times > 39600 && times <= 61200) {
        return styles.midday;
    } else return styles.evening;
}

const SuggestedJourneys = (props: Props) => {
    const { journeys } = props;
    const divArr = [] as any;
    for (let i = 0; i < journeys.length; ++i) {
        divArr.push(
            <div className={styles.journey}>
                <div className={getClass(journeys[i])}>
                    <a href={getJourneyUrl(journeys[i])}>
                        <h2>Journey Option {i + 1}:</h2>
                        <p>Depart from: {stationsById[journeys[i]["fromStationId"]].name}</p>
                        <p>Arrive at: {stationsById[journeys[i]["toStationId"]].name}</p>
                    </a>
                </div>
            </div>
        );
    }
    return divArr;
};

export default SuggestedJourneys;
