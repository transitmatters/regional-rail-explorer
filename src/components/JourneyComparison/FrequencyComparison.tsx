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

const getStationIdToCompare = (baseline: JourneyInfo, enhanced: JourneyInfo) => {
    let firstSegment;
    let journeyWithoutError;
    if ("error" in baseline && "error" in enhanced) {
        return null;
    }
    if ("error" in baseline) {
        journeyWithoutError = enhanced;
        [firstSegment] = [enhanced].map(
            (journey) =>
                journey.segments.find((seg) => seg.kind === "travel") as JourneyTravelSegment
        );
    } else if ("error" in enhanced) {
        journeyWithoutError = baseline;
        [firstSegment] = [baseline].map(
            (journey) =>
                journey.segments.find((seg) => seg.kind === "travel") as JourneyTravelSegment
        );
    } else {
        const [baselineFirstSegment, enhancedFirstSegment] = [baseline, enhanced].map(
            (journey) =>
                journey.segments.find((seg) => seg.kind === "travel") as JourneyTravelSegment
        );
        const hasArrivals =
            baseline.arrivals[baselineFirstSegment.startStation.id] &&
            enhanced.arrivals[enhancedFirstSegment.startStation.id];
        const eitherJourneyStartsWithRegionalRail =
            isRegionalRailRouteId(baselineFirstSegment.routeId) ||
            isRegionalRailRouteId(enhancedFirstSegment.routeId);
        return hasArrivals && eitherJourneyStartsWithRegionalRail
            ? baselineFirstSegment.startStation.id
            : null;
    }
    return journeyWithoutError.arrivals[firstSegment.startStation.id] &&
        isRegionalRailRouteId(firstSegment.routeId)
        ? firstSegment.startStation.id
        : null;
};

const FrequencyInfo = (props: FrequencyInfoProps) => {
    const { journey, arrivalStationId, halfInterval = HOUR * 1.25 } = props;
    if ("error" in journey) {
        return "No train is coming for this route";
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
