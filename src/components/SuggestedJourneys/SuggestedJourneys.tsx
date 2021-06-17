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

function getTimeOfDayClass(params: JourneyParams) {
    const { time } = params;
    if (time === undefined) {
        return styles.midday;
    } else if (time >= 18000 && time <= 39600) {
        return styles.morning;
    } else if (time > 39600 && time <= 61200) {
        return styles.midday;
    } else return styles.evening;
}

const SuggestedJourneys = (props: Props) => {
    const { journeys } = props;
    const divArr = [] as any;
    for (let i = 0; i < journeys.length; ++i) {
        divArr.push(
            <div className={styles.journey} key={i}>
                <div className={getTimeOfDayClass(journeys[i])}>
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
