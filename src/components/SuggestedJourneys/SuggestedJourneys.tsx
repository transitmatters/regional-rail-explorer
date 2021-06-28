import React from "react";
import { stationsById } from "stations";
import { JourneyParams } from "types";
import { BsArrowRight } from "react-icons/bs";

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

function getTimeofDay(params: JourneyParams) {
    const { time } = params;
    if (time === undefined) {
        return "Midday";
    } else if (time >= 18000 && time <= 39600) {
        return "Morning";
    } else if (time > 39600 && time <= 61200) {
        return "Midday";
    } else return "Evening";
}

const SuggestedJourneys = (props: Props) => {
    const { journeys } = props;
    const divArr = [] as any;
    for (let i = 0; i < journeys.length; ++i) {
        const journey = journeys[i];
        divArr.push(
            <div className={styles.journey} key={i}>
                <div className={getTimeOfDayClass(journey)}>
                    <a href={getJourneyUrl(journey)}>
                        <h4>
                            {" "}
                            <p>
                                <span>
                                    Departs: <i>{getTimeofDay(journey)} </i>
                                </span>
                            </p>
                        </h4>
                        <p>
                            <strong>{stationsById[journey["fromStationId"]].name} &emsp; </strong>{" "}
                            <BsArrowRight /> &emsp;
                            <strong>{stationsById[journey["toStationId"]].name}</strong>
                        </p>
                    </a>
                </div>
            </div>
        );
    }
    return divArr;
};

export default SuggestedJourneys;
