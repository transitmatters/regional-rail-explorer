import React from "react";
import classNames from "classnames";
import { IconType } from "react-icons";
import { MdOutlineQrCode, MdOutlineSportsBaseball } from "react-icons/md";
import { FaBriefcase, FaGhost, FaGraduationCap, FaStethoscope } from "react-icons/fa";

import { parseTime, stringifyTime } from "time";
import { stationsByName, stationsById } from "stations";
import { JourneyParams, NetworkDayKind, NetworkTime } from "types";

import styles from "./SuggestedJourneys.module.scss";

type SuggestedJourneyParams = {
    time: string;
    from: string;
    to: string;
    reverse?: boolean;
    day: NetworkDayKind;
    accentIcon: IconType;
    accentColor?: string;
};

type Props = {
    suggestedJourneys?: SuggestedJourneyParams[];
};

const defaultSuggestedJourneys: SuggestedJourneyParams[] = [
    {
        from: "Waltham",
        to: "Back Bay",
        time: "8:40",
        day: "weekday",
        accentIcon: FaBriefcase,
    },
    {
        from: "Lansdowne",
        to: "Oak Grove",
        time: "21:00",
        day: "saturday",
        accentIcon: MdOutlineSportsBaseball,
    },
    {
        from: "Lynn",
        to: "Charles/MGH",
        time: "15:15",
        day: "weekday",
        reverse: true,
        accentIcon: FaStethoscope,
    },
    {
        from: "Uphams Corner",
        to: "Salem",
        time: "12:00",
        day: "sunday",
        accentIcon: FaGhost,
        accentColor: "#fc8c03",
    },
    {
        from: "South Station",
        to: "Wellesley Square",
        time: "10:15",
        day: "weekday",
        accentIcon: FaGraduationCap,
    },
];

const getJourneyUrl = (params: JourneyParams) => {
    const { fromStationId, toStationId, day, time, reverse } = params;
    const reverseElement = reverse ? "&reverse=1" : "";
    return `/explore?from=${fromStationId}&to=${toStationId}&day=${day}&time=${time}${reverseElement}`;
};

const getTimeOfDayColor = (time: NetworkTime) => {
    if (time > 61200) {
        return "#9f4bc2";
    } else if (time >= 39600) {
        return "#4a8ef3";
    }
    return "#ebc90d";
};

const maybeCapitalizeDay = (day: NetworkDayKind) => {
    if (day === "weekday") {
        return day;
    }
    return day.charAt(0).toUpperCase() + day.slice(1);
};

const SuggestedJourneys = (props: Props) => {
    const { suggestedJourneys = defaultSuggestedJourneys } = props;

    const renderedSuggestedJourneys = suggestedJourneys.map((journey, i) => {
        const { from, to, time, day, reverse, accentColor, accentIcon: AccentIcon } = journey;
        const fromStation = stationsById[from] || stationsByName[from];
        const toStation = stationsById[to] || stationsByName[to];
        const parsedTime = parseTime(time);
        const stringTime = stringifyTime(parsedTime, { use12Hour: true });
        const journeyUrl = getJourneyUrl({
            fromStationId: fromStation.id,
            toStationId: toStation.id,
            time: parsedTime,
            reverse: !!reverse,
            day,
        });
        const action = reverse ? "Arrive by" : "Depart at";
        return (
            <a
                className={styles.journey}
                href={journeyUrl}
                key={i}
                style={
                    {
                        "--accent-color": accentColor || getTimeOfDayColor(parsedTime),
                    } as React.CSSProperties
                }
            >
                <div className={classNames(styles.band)} />
                <div className={styles.inner}>
                    <div className={styles.stations}>
                        <div>
                            from <strong>{fromStation.name}</strong>
                        </div>
                        <div>
                            to <strong>{toStation.name}</strong>
                        </div>
                    </div>
                    <div className={styles.departure}>
                        {action} {stringTime} on a {maybeCapitalizeDay(journey.day)}
                    </div>
                    <div className={styles.iconsContainer}>
                        <div className={styles.iconsContainerInner}>
                            <MdOutlineQrCode className={styles.qr} size={80} />
                            <AccentIcon className={styles.accentIcon} size={30} />
                        </div>
                    </div>
                </div>
            </a>
        );
    });

    return (
        <div className={styles.journeys}>
            {renderedSuggestedJourneys}
            <a className={classNames(styles.journey, styles.customJourney)} href="/explore">
                Choose your own commute
            </a>
        </div>
    );
};

export default SuggestedJourneys;
