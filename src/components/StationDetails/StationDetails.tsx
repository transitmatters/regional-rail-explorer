import React from "react";

import { ScenarioInfo } from "types";

import styles from "./StationDetails.module.scss";

export type StationScenarioInfo = {
    scenario: ScenarioInfo;
    station: {
        name: string;
        id: string;
    };
};

type Props = {
    stationScenarioInfo: StationScenarioInfo[];
};

const StationDetail = (props: Props) => {
    const { stationScenarioInfo } = props;
    const [baseline, enhanced] = stationScenarioInfo;
    return (
        <div className={styles.stationDetails}>
            <div className={styles.inner}>
                <div className={styles.infoPane}>
                    <div className={styles.map} />
                    <ul className={styles.metadata}>
                        <li>Municipality</li>
                        <li>
                            <b>X,XXX</b> daily boardings (2019)
                        </li>
                        <li>
                            <b>X,XXX</b> homes within 0.5 miles
                        </li>
                        <li>
                            <b>XX,XXX</b> homes within 1 mile
                        </li>
                        <li>
                            <b>X,XXX</b> jobs within 0.5 miles
                        </li>
                        <li>
                            <b>XX,XXX</b> jobs within 1 mile
                        </li>
                    </ul>
                </div>
                <div className={styles.primaryPane}>
                    <h1>{baseline.station.name}</h1>
                </div>
            </div>
        </div>
    );
};

export default StationDetail;
