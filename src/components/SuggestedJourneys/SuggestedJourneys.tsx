import React from "react";
import classNames from "classnames";
import { IconType } from "react-icons";
import { MdOutlineQrCode, MdOutlineSportsBaseball } from "react-icons/md";
import { FaBriefcase, FaGhost, FaGraduationCap, FaStethoscope } from "react-icons/fa";

import { parseTime, stringifyTime } from "time";
import { stationsByName, stationsById } from "stations";
import { JourneyParams, NetworkDayKind, NetworkTime, NavigationKind } from "types";

import styles from "./SuggestedJourneys.module.scss";
import Link from "next/link";

type SuggestedJourneyParams = {
    time: string;
    from: string;
    to: string;
    navigationKind: NavigationKind;
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
        navigationKind: "depart-at",
    },
    {
        from: "Lansdowne",
        to: "Oak Grove",
        time: "21:00",
        day: "saturday",
        accentIcon: MdOutlineSportsBaseball,
        navigationKind: "depart-at",
    },
    {
        from: "Lynn",
        to: "Charles/MGH",
        time: "15:15",
        day: "weekday",
        accentIcon: FaStethoscope,
        navigationKind: "arrive-by",
    },
    {
        from: "Uphams Corner",
        to: "Salem",
        time: "12:00",
        day: "sunday",
        accentIcon: FaGhost,
        accentColor: "#fc8c03",
        navigationKind: "depart-at",
    },
    {
        from: "South Station",
        to: "Wellesley Square",
        time: "10:15",
        day: "weekday",
        accentIcon: FaGraduationCap,
        navigationKind: "depart-at",
    },
];

const getJourneyUrl = (params: JourneyParams) => {
    const { fromStationId, toStationId, day, time, navigationKind } = params;
    return `/explore?from=${fromStationId}&to=${toStationId}&day=${day}&time=${time}&navigationKind=${navigationKind}`;
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

const SuggestedJourneys: React.FunctionComponent<Props> = (props) => {
    const { suggestedJourneys = defaultSuggestedJourneys } = props;

    const renderedSuggestedJourneys = suggestedJourneys.map((journey, i) => {
        const {
            from,
            to,
            time,
            day,
            navigationKind,
            accentColor,
            accentIcon: AccentIcon,
        } = journey;
        const fromStation = stationsById[from] || stationsByName[from];
        const toStation = stationsById[to] || stationsByName[to];
        const parsedTime = parseTime(time);
        const stringTime = stringifyTime(parsedTime, { use12Hour: true });
        const journeyUrl = getJourneyUrl({
            fromStationId: fromStation.id,
            toStationId: toStation.id,
            time: parsedTime,
            navigationKind: navigationKind,
            day,
        });
        const action = navigationKind === "arrive-by" ? "Arrive by" : "Depart at";
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
            <Link className={classNames(styles.journey, styles.customJourney)} href="/explore">
                Choose your own commute
            </Link>
        </div>
    );
};

export default SuggestedJourneys;
