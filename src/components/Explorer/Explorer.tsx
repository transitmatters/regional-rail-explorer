import React, { useState, useEffect, useMemo } from "react";
import { CgSpinner } from "react-icons/cg";

import { stationsByLine, stationsById } from "stations";

import * as api from "api";
import {
    JourneyInfo,
    NetworkDayKind,
    TimeOfDay,
    JourneyApiResult,
    NetworkTimeRange,
    ArrivalsInfo,
} from "types";
import {
    DeparturePicker,
    JourneyPicker,
    JourneyComparison,
    JourneyErrorState,
    AppFrame,
    PowerText,
    SuggestedJourneys,
} from "components";
import { useRouterBoundState, usePendingPromise, useUpdateEffect } from "hooks";
import { getSpanningTimeRange, HOUR } from "time";
import { successfulJourneyApiResult } from "journeys";

import { getAdvantageousDepartureTime } from "./departures";

import styles from "./Explorer.module.scss";
import getSocialMeta from "./socialMeta";

const scenarioIds = ["present", "regional_rail"];

type NavigationKind = "depart-at" | "arrive-by" | "depart-after";

type Props = {
    journeys: null | JourneyInfo[];
    arrivals: null | ArrivalsInfo;
};

const Explorer = (props: Props) => {
    const { journeys: initialJourneys, arrivals: initialArrivals } = props;
    const [
        { fromStationId, toStationId, day, time, navigationKind = "depart-at", reverse = false },
        updateJourneyParams,
    ] = useRouterBoundState(
        {
            fromStationId: {
                initial: null as null | string,
                param: "from",
            },
            toStationId: {
                initial: null as null | string,
                param: "to",
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
            return {
                shallow: true,
                replace:
                    previousState.fromStationId === nextState.fromStationId &&
                    previousState.toStationId === nextState.toStationId,
            };
        }
    );
    const [arrivals, setArrivals] = useState<null | ArrivalsInfo>(initialArrivals);
    const [journeys, setJourneys] = useState<null | JourneyApiResult>(initialJourneys);
    const [requestedTimeOfDay, setRequestedTimeOfDay] = useState<null | TimeOfDay>(null);
    const [isJourneyPending, wrapJourneyPending] = usePendingPromise();
    const successfulJourneys = journeys && successfulJourneyApiResult(journeys);
    const reverseFromNav = reverse || navigationKind === "arrive-by";
    console.log(reverseFromNav);

    const timeRange = useMemo(() => {
        if (arrivals) {
            const { baselineArrivals, enhancedArrivals } = arrivals;
            return getSpanningTimeRange([...baselineArrivals, ...enhancedArrivals]);
        }
        return [0, 24 * HOUR] as NetworkTimeRange;
    }, [arrivals]);

    useUpdateEffect(() => {
        setArrivals(null);
        if (fromStationId && toStationId && day) {
            api.arrivals(fromStationId, toStationId, day, scenarioIds).then(setArrivals);
            if (!time) {
                setRequestedTimeOfDay("morning");
            }
        }
    }, [fromStationId, toStationId, day]);

    useUpdateEffect(() => {
        setJourneys(null);
        if (fromStationId && toStationId && day && time) {
            wrapJourneyPending(
                api
                    .journeys(fromStationId, toStationId, day, time, navigationKind, scenarioIds)
                    .then(setJourneys)
            );
        }
    }, [fromStationId, toStationId, day, time, navigationKind]);

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
            // make sure to show error state if regional rail is the one to fail
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

    return (
        <AppFrame
            mode="journey"
            containerClassName={styles.explorer}
            meta={getSocialMeta({
                journeyParams: { fromStationId, toStationId, time, day, reverse: reverseFromNav },
                journeys: successfulJourneys,
            })}
            controls={
                <JourneyPicker
                    disabled={isJourneyPending}
                    reverse={!!reverseFromNav}
                    time={time}
                    timeRange={timeRange}
                    day={day}
                    stationsById={stationsById}
                    stationsByLine={stationsByLine}
                    fromStationId={fromStationId}
                    toStationId={toStationId}
                    updateJourneyParams={updateJourneyParams}
                    onSelectTimeOfDay={setRequestedTimeOfDay}
                    onSelectDay={(day) => updateJourneyParams({ day })}
                />
            }
        >
            {renderDeparturePicker()}
            {renderJourneyComparison()}
            {renderFooter()}
        </AppFrame>
    );
};

export default Explorer;
