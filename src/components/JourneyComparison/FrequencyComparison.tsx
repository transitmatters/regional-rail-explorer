import React from "react";
import classNames from "classnames";

import { JourneyInfo, JourneyTransferSegment, Duration, JourneyTravelSegment } from "types";
import { HOUR, stringifyDuration } from "time";
import { isRegionalRailRouteId, isSilverLineRouteId } from "routes";

import { ComparisonProps } from "./types";
import ComparisonRow from "./ComparisonRow";

import styles from "./JourneyComparison.module.scss";

interface FrequencyInfoProps {
    journey: JourneyInfo;
    halfInterval?: Duration;
    arrivalStationId: string;
}

const getFirstStationAndRouteFromJourney = (journey: JourneyInfo) => {
    const [firstSegment] = [journey].map(
        (j) => j.segments.find((seg) => seg.kind === "travel") as JourneyTravelSegment
    );
    return { routeId: firstSegment?.routeId, stationId: firstSegment?.startStation?.id };
};

const getStationIdToCompare = (baseline: JourneyInfo, enhanced: JourneyInfo) => {
    const [
        { routeId: baselineRouteId, stationId: baselineStationId },
        { routeId: enhancedRouteId, stationId: enhancedStationId },
    ] = [baseline, enhanced].map(getFirstStationAndRouteFromJourney);

    const eitherJourneyStartsWithRegionalRail =
        (baselineRouteId && isRegionalRailRouteId(baselineRouteId)) ||
        (enhancedRouteId && isRegionalRailRouteId(enhancedRouteId));

    return eitherJourneyStartsWithRegionalRail ? baselineStationId || enhancedStationId : null;
};

const FrequencyInfo = (props: FrequencyInfoProps) => {
    const { journey, arrivalStationId, halfInterval = HOUR * 1.25 } = props;
    if (journey.navigationFailed) {
        return <>No train is coming for this route.</>;
    }
    const {
        segments,
        arrivals: {
            [arrivalStationId]: { times },
        },
    } = journey;
    const arriveAtPlatform = (segments[0] as JourneyTransferSegment).startTime;
    const now = times.find((time) => time >= arriveAtPlatform)!;
    const shownTimes = times.filter((time) => Math.abs(time - now) <= halfInterval);
    const nextHeadwayIndex = shownTimes.findIndex((time) => time >= now);
    const nextArrival = shownTimes[nextHeadwayIndex];
    const subsequentArrival = shownTimes[nextHeadwayIndex + 1];
    const subsequentHeadway = subsequentArrival - nextArrival;
    const waitWidth = (50 * subsequentHeadway) / halfInterval;
    const waitLeft = 50 * (1 + (nextArrival - now) / halfInterval);
    const firstTravelSegment = journey.segments.find(
        (seg) => seg.kind === "travel"
    ) as JourneyTravelSegment;
    const noun = isSilverLineRouteId(firstTravelSegment.routeId) ? "bus" : "train";
    const text = Number.isFinite(subsequentHeadway) ? (
        <>
            Another {noun} is coming in {stringifyDuration(subsequentHeadway, true)}.
        </>
    ) : (
        <>
            Another {noun} isn't coming for at least {stringifyDuration(halfInterval, true)}.
        </>
    );
    return (
        <div className={styles.frequencyInfo}>
            <div className="timeline">
                <div className="line" />
                <div
                    className="wait-line"
                    style={{ left: `${waitLeft}%`, width: `${waitWidth}%` }}
                />
                {shownTimes.map((time, index) => {
                    const left = 50 * (1 + (time - now) / halfInterval);
                    return (
                        <div
                            key={index}
                            style={{ left: `${left}%` }}
                            className={classNames(
                                "time",
                                index === nextHeadwayIndex && "missed",
                                index === nextHeadwayIndex + 1 && "caught"
                            )}
                        />
                    );
                })}
            </div>
            <div className="secondary">{text}</div>
        </div>
    );
};

const FrequencyComparison = (props: ComparisonProps) => {
    const { baseline, enhanced } = props;
    const idToCompare = getStationIdToCompare(baseline, enhanced);
    if (idToCompare) {
        return (
            <ComparisonRow
                title={`Missed your train?`}
                baseline={<FrequencyInfo journey={baseline} arrivalStationId={idToCompare} />}
                enhanced={<FrequencyInfo journey={enhanced} arrivalStationId={idToCompare} />}
            />
        );
    }
    return null;
};

export default FrequencyComparison;
