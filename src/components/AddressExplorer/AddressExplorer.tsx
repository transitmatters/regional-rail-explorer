import React, { useEffect, useMemo, useState } from "react";
import { CgSpinner } from "react-icons/cg";

import * as api from "api";
import {
    JourneyInfo,
    NetworkDayKind,
    TimeOfDay,
    JourneyApiResult,
    NetworkTimeRange,
    ArrivalsInfo,
    NavigationKind,
} from "types";
import {
    DeparturePicker,
    JourneyComparison,
    JourneyErrorState,
    AppFrame,
    PowerText,
    SuggestedJourneys,
} from "components";
import { useRouterBoundState, usePendingPromise, useUpdateEffect } from "hooks";
import { getSpanningTimeRange, HOUR } from "time";
import { successfulJourneyApiResult } from "journeys";

import AddressJourneyPicker from "../AddressJourneyPicker/AddressJourneyPicker";

import { getAdvantageousDepartureTime } from "../Explorer/departures";
import styles from "../Explorer/Explorer.module.scss";

type NearestStation = {
    id: string;
    name: string;
    distanceMeters: number;
};

const scenarioIds = ["present", "regional_rail"];

const isFiniteNumber = (value: number | null) =>
    typeof value === "number" && Number.isFinite(value);

const fetchNearestStation = async (lat: number, lon: number) => {
    const res = await fetch(`/api/nearestStation?lat=${lat}&lon=${lon}`);
    if (!res.ok) {
        return null;
    }
    return (await res.json()) as NearestStation;
};

const formatDistance = (distanceMeters: number) => {
    const metersPerMile = 1609.34;
    const miles = distanceMeters / metersPerMile;
    if (miles < 0.1) {
        return `${Math.round(miles * 5280)} ft`;
    }
    return `${miles.toFixed(1)} mi`;
};

const AddressExplorer: React.FunctionComponent = () => {
    const [
        {
            fromAddress,
            toAddress,
            fromLat,
            fromLon,
            toLat,
            toLon,
            day,
            time,
            navigationKind = "depart-at",
            reverse = false,
        },
        updateJourneyParams,
    ] = useRouterBoundState(
        {
            fromAddress: {
                initial: "" as string,
                param: "fromAddress",
            },
            toAddress: {
                initial: "" as string,
                param: "toAddress",
            },
            fromLat: {
                initial: null as null | number,
                param: "fromLat",
                decode: parseFloat,
                encode: (value) => (Number.isFinite(value) ? value.toString() : ""),
            },
            fromLon: {
                initial: null as null | number,
                param: "fromLon",
                decode: parseFloat,
                encode: (value) => (Number.isFinite(value) ? value.toString() : ""),
            },
            toLat: {
                initial: null as null | number,
                param: "toLat",
                decode: parseFloat,
                encode: (value) => (Number.isFinite(value) ? value.toString() : ""),
            },
            toLon: {
                initial: null as null | number,
                param: "toLon",
                decode: parseFloat,
                encode: (value) => (Number.isFinite(value) ? value.toString() : ""),
            },
            day: {
                initial: "weekday" as NetworkDayKind,
                param: "day",
            },
            time: {
                initial: null as null | number,
                param: "time",
                decode: parseInt,
                encode: (t) => t?.toString(),
            },
            navigationKind: {
                initial: "depart-at" as NavigationKind,
                param: "navigationKind",
            },
            reverse: {
                initial: false,
                param: "reverse",
                decode: (s) => s === "1",
                encode: (b) => (b ? "1" : "0"),
            },
        },
        (previousState, nextState) => {
            const sameEndpoints =
                previousState.fromAddress === nextState.fromAddress &&
                previousState.toAddress === nextState.toAddress &&
                previousState.fromLat === nextState.fromLat &&
                previousState.fromLon === nextState.fromLon &&
                previousState.toLat === nextState.toLat &&
                previousState.toLon === nextState.toLon;
            return {
                shallow: true,
                replace: sameEndpoints,
            };
        }
    );

    const [fromStation, setFromStation] = useState<null | NearestStation>(null);
    const [toStation, setToStation] = useState<null | NearestStation>(null);
    const [arrivals, setArrivals] = useState<null | ArrivalsInfo>(null);
    const [journeys, setJourneys] = useState<null | JourneyApiResult>(null);
    const [requestedTimeOfDay, setRequestedTimeOfDay] = useState<null | TimeOfDay>(null);
    const [isJourneyPending, wrapJourneyPending] = usePendingPromise();
    const successfulJourneys = journeys && successfulJourneyApiResult(journeys);
    const reverseFromNav = reverse || navigationKind === "arrive-by";

    useEffect(() => {
        if (isFiniteNumber(fromLat) && isFiniteNumber(fromLon)) {
            fetchNearestStation(fromLat, fromLon).then(setFromStation);
        } else {
            setFromStation(null);
        }
    }, [fromLat, fromLon]);

    useEffect(() => {
        if (isFiniteNumber(toLat) && isFiniteNumber(toLon)) {
            fetchNearestStation(toLat, toLon).then(setToStation);
        } else {
            setToStation(null);
        }
    }, [toLat, toLon]);

    const timeRange = useMemo(() => {
        if (arrivals) {
            const { baselineArrivals, enhancedArrivals } = arrivals;
            return getSpanningTimeRange([...baselineArrivals, ...enhancedArrivals]);
        }
        return [0, 24 * HOUR] as NetworkTimeRange;
    }, [arrivals]);

    useUpdateEffect(() => {
        setArrivals(null);
        if (fromStation && toStation && day) {
            api.arrivals(fromStation.id, toStation.id, day, scenarioIds).then(setArrivals);
            if (!time) {
                setRequestedTimeOfDay("morning");
            }
        }
    }, [fromStation?.id, toStation?.id, day]);

    useUpdateEffect(() => {
        setJourneys(null);
        if (fromStation && toStation && day && time) {
            wrapJourneyPending(
                api
                    .journeys(fromStation.id, toStation.id, day, time, navigationKind, scenarioIds)
                    .then(setJourneys)
            );
        }
    }, [fromStation?.id, toStation?.id, day, time, navigationKind]);

    useEffect(() => {
        if (requestedTimeOfDay && arrivals) {
            const { baselineArrivals, enhancedArrivals } = arrivals;
            const time = getAdvantageousDepartureTime(
                requestedTimeOfDay,
                baselineArrivals,
                enhancedArrivals
            )!;
            setRequestedTimeOfDay(null);
            updateJourneyParams({ time });
        }
    }, [requestedTimeOfDay, arrivals]);

    const renderDeparturePicker = () => {
        if (arrivals) {
            const { baselineArrivals, enhancedArrivals, showArrivals } = arrivals;
            return (
                <DeparturePicker
                    baselineArrivals={baselineArrivals}
                    enhancedArrivals={enhancedArrivals}
                    showArrivals={!reverseFromNav && showArrivals}
                    includeQuarterHourTicks={!!reverseFromNav}
                    onSelectTime={(time) => updateJourneyParams({ time })}
                    time={time}
                    timeRange={timeRange}
                    disabled={isJourneyPending}
                />
            );
        }
        return null;
    };

    const renderJourneyComparison = () => {
        if (isJourneyPending) {
            return (
                <div className={styles.spinnerContainer}>
                    <CgSpinner className="spinning" size={50} />
                </div>
            );
        }
        if (journeys) {
            const journeyResolvedWithError = journeys.find((j) => "error" in j);
            if (journeyResolvedWithError && "error" in journeyResolvedWithError) {
                return <JourneyErrorState />;
            }
            const [baseline, enhanced] = journeys as JourneyInfo[];
            if (
                enhanced.navigationFailed ||
                (baseline.navigationFailed && enhanced.navigationFailed)
            ) {
                return <JourneyErrorState />;
            }

            return (
                <JourneyComparison
                    baseline={baseline}
                    enhanced={enhanced}
                    departAfter={navigationKind === "depart-after"}
                />
            );
        }
        return null;
    };

    const renderFooter = () => {
        if (journeys) {
            return (
                <div className={styles.footer}>
                    <div className={styles.footerInner}>
                        <PowerText>Where to next?</PowerText>
                        <SuggestedJourneys />
                    </div>
                </div>
            );
        }
    };

    const renderNearestInfo = () => {
        if (!fromStation && !toStation) {
            return null;
        }
        return (
            <div className={styles.nearestInfo}>
                {fromStation && (
                    <div>
                        Start: {formatDistance(fromStation.distanceMeters)} from {fromStation.name}
                    </div>
                )}
                {toStation && (
                    <div>
                        End: {formatDistance(toStation.distanceMeters)} from {toStation.name}
                    </div>
                )}
            </div>
        );
    };

    const handleSwap = () => {
        updateJourneyParams({
            fromAddress: toAddress,
            fromLat: toLat,
            fromLon: toLon,
            toAddress: fromAddress,
            toLat: fromLat,
            toLon: fromLon,
        });
    };

    const handleChangeFromAddress = (value: string) => {
        updateJourneyParams({ fromAddress: value, fromLat: null, fromLon: null });
    };

    const handleChangeToAddress = (value: string) => {
        updateJourneyParams({ toAddress: value, toLat: null, toLon: null });
    };

    return (
        <AppFrame
            mode="journey"
            containerClassName={styles.explorer}
            controlsClassName={styles.controlsOverflowVisible}
            controls={
                <AddressJourneyPicker
                    disabled={isJourneyPending}
                    navigationKind={navigationKind}
                    time={time}
                    timeRange={timeRange}
                    day={day}
                    fromAddress={fromAddress}
                    toAddress={toAddress}
                    onSelectDay={(day) => updateJourneyParams({ day })}
                    onSelectTimeOfDay={setRequestedTimeOfDay}
                    onSelectNavigationKind={(kind) => updateJourneyParams({ navigationKind: kind })}
                    onSelectTime={(time) => updateJourneyParams({ time })}
                    onSwap={handleSwap}
                    onChangeFromAddress={handleChangeFromAddress}
                    onChangeToAddress={handleChangeToAddress}
                    onSelectFromAddress={(selection) =>
                        updateJourneyParams({
                            fromAddress: selection.label,
                            fromLat: selection.lat,
                            fromLon: selection.lon,
                        })
                    }
                    onSelectToAddress={(selection) =>
                        updateJourneyParams({
                            toAddress: selection.label,
                            toLat: selection.lat,
                            toLon: selection.lon,
                        })
                    }
                />
            }
        >
            {renderNearestInfo()}
            {renderDeparturePicker()}
            {renderJourneyComparison()}
            {renderFooter()}
        </AppFrame>
    );
};

export default AddressExplorer;
