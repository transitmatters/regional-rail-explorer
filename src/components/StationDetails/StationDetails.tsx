import React, { useEffect, useState } from "react";

import { ArrivalsInfo, ScenarioInfo } from "types";

import styles from "./StationDetails.module.scss";
import * as api from "../../api";
import { stringifyDuration, stringifyTime } from "../../time";
import dynamic from "next/dynamic";
import ComparisonRow from "../JourneyComparison/ComparisonRow";

const scenarioIds = ["present", "regional_rail"];

export type StationScenarioInfo = {
    scenario: ScenarioInfo;
    station: {
        name: string;
        id: string;
        municipality?: string;
        latitude: number;
        longitude: number;
    };
};

type Props = {
    stationScenarioInfo: StationScenarioInfo[];
};

const StationDetail = (props: Props) => {
    const [inboundArrivals, setInboundArrivals] = useState<null | ArrivalsInfo>();
    const [outboundArrivals, setOutboundArrivals] = useState<null | ArrivalsInfo>();
    const { stationScenarioInfo } = props;
    const [baseline, enhanced] = stationScenarioInfo;

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

    const DynamicStationMap = dynamic(() => import("./StationMap"), {
        ssr: false,
    });

    const now = new Date();
    const currentTimeSeconds = now.getHours() * 60 * 60 + now.getMinutes() * 60 + now.getSeconds();

    const baselineInboundNextArrival = inboundArrivals?.baselineArrivals
        .filter((time) => time >= currentTimeSeconds)
        .at(0);
    const enhancedInboundNextArrival = inboundArrivals?.enhancedArrivals
        .filter((time) => time >= currentTimeSeconds)
        .at(0);
    const baselineInboundWaitDuration =
        baselineInboundNextArrival && baselineInboundNextArrival - currentTimeSeconds;
    const enhancedInboundWaitDuration =
        enhancedInboundNextArrival && enhancedInboundNextArrival - currentTimeSeconds;
    const favorableInboundWaitFraction =
        enhancedInboundWaitDuration &&
        baselineInboundWaitDuration &&
        1 - enhancedInboundWaitDuration / baselineInboundWaitDuration;

    const baselineOutboundNextArrival = outboundArrivals?.baselineArrivals
        .filter((time) => time >= currentTimeSeconds)
        .at(0);
    const enhancedOutboundNextArrival = outboundArrivals?.enhancedArrivals
        .filter((time) => time >= currentTimeSeconds)
        .at(0);
    const baselineOutboundWaitDuration =
        baselineOutboundNextArrival && baselineOutboundNextArrival - currentTimeSeconds;
    const enhancedOutboundWaitDuration =
        enhancedOutboundNextArrival && enhancedOutboundNextArrival - currentTimeSeconds;
    const favorableOutboundWaitFraction =
        enhancedOutboundWaitDuration &&
        baselineOutboundWaitDuration &&
        1 - enhancedOutboundWaitDuration / baselineOutboundWaitDuration;

    return (
        <div className={styles.stationDetails}>
            <div className={styles.inner}>
                <DynamicStationMap
                    latitude={baseline.station.latitude}
                    longitude={baseline.station.longitude}
                />
                <h1 className={styles.stationName}>{baseline.station.name}</h1>
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
                <div className={styles.journeyComparison}>
                    <ComparisonRow
                        baseline={
                            <div className="column-header">
                                <div className="header-blip baseline" />
                                {baseline.scenario.name}
                            </div>
                        }
                        enhanced={
                            <div className="column-header">
                                <div className="header-blip enhanced" />
                                {enhanced.scenario.name}
                            </div>
                        }
                        isHeader
                    />
                    <ComparisonRow
                        title="Inbound"
                        baseline={
                            <>
                                <div className="duration">
                                    {stringifyDuration(baselineInboundWaitDuration)} waiting for
                                    Commuter Rail trains
                                </div>
                            </>
                        }
                        enhanced={
                            <>
                                <div className="duration">
                                    {stringifyDuration(enhancedInboundWaitDuration)} waiting for
                                    Regional Rail trains
                                    {favorableInboundWaitFraction &&
                                        favorableInboundWaitFraction! > 0 && (
                                            <div className="bubble offset-left green">
                                                {Math.round(100 * favorableInboundWaitFraction!)}% less
                                            </div>
                                        )}
                                </div>
                            </>
                        }
                    />
                    <ComparisonRow
                        title="Outbound"
                        baseline={
                            <>
                                <div className="duration">
                                    {stringifyDuration(baselineOutboundWaitDuration)} waiting for
                                    Commuter Rail trains
                                </div>
                            </>
                        }
                        enhanced={
                            <>
                                <div className="duration">
                                    {stringifyDuration(enhancedOutboundWaitDuration)} waiting for
                                    Regional Rail trains
                                    {favorableOutboundWaitFraction &&
                                        favorableOutboundWaitFraction! > 0 && (
                                            <div className="bubble offset-left green">
                                                {Math.round(100 * favorableOutboundWaitFraction!)}%
                                                less
                                            </div>
                                        )}
                                </div>
                            </>
                        }
                    />
                    <h3>Inbound Departures</h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gridGap: 20,
                        }}
                    >
                        <div>
                            {inboundArrivals?.baselineArrivals
                                .filter((time) => time >= currentTimeSeconds)
                                .slice(0, 3)
                                .map((time, index) => {
                                    return <div key={index}>{stringifyTime(time)}</div>;
                                })}
                        </div>
                        <div>
                            {inboundArrivals?.enhancedArrivals
                                .filter((time) => time >= currentTimeSeconds)
                                .slice(0, 3)
                                .map((time, index) => {
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
                            {outboundArrivals?.baselineArrivals
                                .filter((time) => time >= currentTimeSeconds)
                                .slice(0, 3)
                                .map((time, index) => {
                                    return <div key={index}>{stringifyTime(time)}</div>;
                                })}
                        </div>
                        <div>
                            {outboundArrivals?.enhancedArrivals
                                .filter((time) => time >= currentTimeSeconds)
                                .slice(0, 3)
                                .map((time, index) => {
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
