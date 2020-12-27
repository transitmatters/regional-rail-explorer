import React from "react";
import classNames from "classnames";

import { JourneyInfo, JourneyTransferSegment, Duration } from "types";
import { HOUR, stringifyDuration } from "time";

import { ComparisonProps } from "./types";
import ComparisonRow from "./ComparisonRow";

import styles from "./JourneyComparison.module.scss";

interface FrequencyInfoProps {
    journey: JourneyInfo;
    halfInterval?: Duration;
    arrivalStationId: string;
}

const getSubsequentHeadway = (journey: JourneyInfo, arrivalStationId: string): Duration => {
    const {
        segments,
        arrivals: {
            [arrivalStationId]: { times },
        },
    } = journey;
    const now = (segments[0] as JourneyTransferSegment).startTime;
    const indexOfNext = times.findIndex((arr) => arr > now);
    return times[indexOfNext + 1] - times[indexOfNext];
};

const getBestFrequencyComparison = (baseline: JourneyInfo, enhanced: JourneyInfo) => {
    const allStationIds = [...Object.keys(baseline.arrivals), ...Object.keys(enhanced.arrivals)];
    const comparableStationIds = allStationIds.filter(
        (id) => baseline.arrivals[id] && enhanced.arrivals[id]
    );
    const subsequentHeadwayDifferences = {};
    comparableStationIds.forEach((id) => {
        subsequentHeadwayDifferences[id] =
            getSubsequentHeadway(baseline, id) - getSubsequentHeadway(enhanced, id);
    });
    const idToCompare = comparableStationIds
        .sort((a, b) => subsequentHeadwayDifferences[a] - subsequentHeadwayDifferences[b])
        .pop();
    return idToCompare;
};

const FrequencyInfo = (props: FrequencyInfoProps) => {
    const { journey, arrivalStationId, halfInterval = HOUR * 1.25 } = props;
    const {
        segments,
        arrivals: {
            [arrivalStationId]: { times },
        },
    } = journey;
    const arriveAtPlatform = (segments[0] as JourneyTransferSegment).startTime;
    const now = times.find((time) => time >= arriveAtPlatform);
    const shownTimes = times.filter((time) => Math.abs(time - now) <= halfInterval);
    const nextHeadwayIndex = shownTimes.findIndex((time) => time >= now);
    const subsequentHeadway = getSubsequentHeadway(journey, arrivalStationId);
    const nextArrival = shownTimes[nextHeadwayIndex];
    const subsequentArrival = shownTimes[nextHeadwayIndex + 1];
    const waitWidth = (50 * (subsequentArrival - nextArrival)) / halfInterval;
    const waitLeft = 50 * (1 + (nextArrival - now) / halfInterval);
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
                            key={time}
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
            <div className="secondary">
                Another train is coming in {stringifyDuration(subsequentHeadway, true)}.
            </div>
        </div>
    );
};

const FrequencyComparison = (props: ComparisonProps) => {
    const { baseline, enhanced } = props;
    const idToCompare = getBestFrequencyComparison(baseline, enhanced);
    if (idToCompare) {
        return (
            <ComparisonRow
                title="Missed your train?"
                baseline={<FrequencyInfo journey={baseline} arrivalStationId={idToCompare} />}
                enhanced={<FrequencyInfo journey={enhanced} arrivalStationId={idToCompare} />}
            />
        );
    }
    return null;
};

export default FrequencyComparison;
