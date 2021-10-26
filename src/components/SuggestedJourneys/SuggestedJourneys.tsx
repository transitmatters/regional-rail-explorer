import React from "react";
import classNames from "classnames";

import { stationsById } from "stations";
import { JourneyParams } from "types";

import styles from "./SuggestedJourneys.module.scss";

type Props = {
    suggestedJourneys?: JourneyParams[];
};

const defaultSuggestedJourneys: JourneyParams[] = [
    {
        fromStationId: "place-ER-0168",
        toStationId: "place-bbsta",
        day: "weekday",
        time: 32010,
    },
    {
        fromStationId: "place-DB-2222",
        toStationId: "place-knncl",
        day: "weekday",
        time: 51300,
    },
    {
        fromStationId: "ER-0046",
        toStationId: "place-NEC-1851",
        day: "weekday",
        time: 73358,
    },
];

const getJourneyUrl = (params: JourneyParams) => {
    const { fromStationId, toStationId, day, time } = params;
    return `/explore?from=${fromStationId}&to=${toStationId}&day=${day}&time=${time}`;
};

const getTimeOfDayClass = (params: JourneyParams) => {
    const { time } = params;
    if (time === undefined) {
        return styles.midday;
    } else if (time >= 18000 && time <= 39600) {
        return styles.morning;
    } else if (time > 39600 && time <= 61200) {
        return styles.midday;
    } else return styles.evening;
};

const getTimeofDay = (params: JourneyParams) => {
    const { time } = params;
    if (time === undefined) {
        return "Midday";
    } else if (time >= 18000 && time <= 39600) {
        return "Morning";
    } else if (time > 39600 && time <= 61200) {
        return "Midday";
    } else return "Evening";
};

const SuggestedJourneys = (props: Props) => {
    const { suggestedJourneys = defaultSuggestedJourneys } = props;
    const renderedSuggestedJourneys = suggestedJourneys.map((journey, i) => {
        const { fromStationId, toStationId } = journey;
        const fromStation = stationsById[fromStationId];
        const toStation = stationsById[toStationId];
        return (
            <a
                className={classNames(styles.journey, getTimeOfDayClass(journey))}
                href={getJourneyUrl(journey)}
                key={i}
            >
                <div className={styles.departure}>
                    Departs: <i>{getTimeofDay(journey)} </i>
                </div>
                <div className={styles.stations}>
                    <strong>{fromStation.name}</strong> &rarr; <strong>{toStation.name}</strong>
                </div>
            </a>
        );
    });

    return (
        <>
            {renderedSuggestedJourneys}
            <a className={classNames(styles.journey, styles.customJourney)} href="/explore">
                Choose your own commute
            </a>
        </>
    );
};

export default SuggestedJourneys;
