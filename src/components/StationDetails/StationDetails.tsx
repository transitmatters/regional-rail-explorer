import React, { useEffect, useState } from "react";

import { ArrivalsInfo, ScenarioInfo } from "types";

import styles from "./StationDetails.module.scss";
import * as api from "../../api";
import { stringifyTime } from "../../time";

const scenarioIds = ["present", "regional_rail"];

export type StationScenarioInfo = {
    scenario: ScenarioInfo;
    station: {
        name: string;
        id: string;
        municipality?: string;
    };
};

type Props = {
    stationScenarioInfo: StationScenarioInfo[];
};

const StationDetail = (props: Props) => {
    const [inboundArrivals, setInboundArrivals] = useState<null | ArrivalsInfo>();
    const [outboundArrivals, setOutboundArrivals] = useState<null | ArrivalsInfo>();
    const { stationScenarioInfo } = props;
    const [baseline] = stationScenarioInfo;

    useEffect(() => {
        api.arrivals(baseline.station.id, "place-north", "weekday", scenarioIds).then(
            setInboundArrivals
        );
    }, [baseline]);

    useEffect(() => {
        api.arrivals(baseline.station.id, "place-FR-3338", "weekday", scenarioIds).then(
            setOutboundArrivals
        );
    }, [baseline]);

    return (
        <div className={styles.stationDetails}>
            <div className={styles.inner}>
                <div className={styles.infoPane}>
                    <div className={styles.map} />
                    <ul className={styles.metadata}>
                        <li>{baseline.station?.municipality ?? "Unknown Municipality"}</li>
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
                    <h3>Inbound Departures</h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gridGap: 20,
                        }}
                    >
                        <div>
                            {inboundArrivals?.baselineArrivals.map((time, index) => {
                                return <div key={index}>{stringifyTime(time)}</div>;
                            })}
                        </div>
                        <div>
                            {inboundArrivals?.enhancedArrivals.map((time, index) => {
                                return <div key={index}>{stringifyTime(time)}</div>;
                            })}
                        </div>
                    </div>
                    <h3>Outbound Departures</h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gridGap: 20,
                        }}
                    >
                        <div>
                            {outboundArrivals?.baselineArrivals.map((time, index) => {
                                return <div key={index}>{stringifyTime(time)}</div>;
                            })}
                        </div>
                        <div>
                            {outboundArrivals?.enhancedArrivals.map((time, index) => {
                                return <div key={index}>{stringifyTime(time)}</div>;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StationDetail;
