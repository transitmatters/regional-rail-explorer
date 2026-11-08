import React from "react";
import classNames from "classnames";

import { JourneyInfo, JourneySegment, Duration, JourneyTravelSegment } from "types";
import { HOUR, stringifyDuration } from "time";
import { isRegionalRailRouteId, isSilverLineRouteId } from "routes";

import { ComparisonProps } from "./types";
import ComparisonRow from "./ComparisonRow";

import styles from "./JourneyComparison.module.scss";

interface FrequencyInfoProps {
    journey: JourneyInfo;
    halfInterval?: Duration;
}

const getFirstTravelSegment = (journey: JourneyInfo) =>
    journey.segments.find((seg): seg is JourneyTravelSegment => seg.kind === "travel");

const eitherJourneyStartsWithRegionalRail = (baseline: JourneyInfo, enhanced: JourneyInfo) =>
    [baseline, enhanced].some((journey) => {
        const routeId = getFirstTravelSegment(journey)?.routeId;
        return !!routeId && isRegionalRailRouteId(routeId);
    });

// Where the rider reaches the platform to wait for their first train, after any walk to it
const getArriveAtPlatformTime = (segments: JourneySegment[]) => {
    const [first] = segments;
    return first.kind === "transfer" ? first.startTime + first.walkDuration : first.startTime;
};

const FrequencyInfo = (props: FrequencyInfoProps) => {
    const { journey, halfInterval = HOUR * 1.25 } = props;
    if (journey.navigationFailed) {
        return <div className="secondary">No Commuter Rail train to catch.</div>;
    }
    const { segments, arrivals } = journey;
    // Each journey can board its first train at a different station, since one may walk to a
    // nearby station first, so look up the arrivals where this journey boards
    const firstTravelSegment = getFirstTravelSegment(journey);
    const times = firstTravelSegment && arrivals[firstTravelSegment.startStation.id]?.times;
    const arriveAtPlatform = getArriveAtPlatformTime(segments);
    const now = times?.find((time) => time >= arriveAtPlatform);
    if (!firstTravelSegment || !times || now === undefined) {
        return <div className="secondary">-</div>;
    }
    const shownTimes = times.filter((time) => Math.abs(time - now) <= halfInterval);
    const nextHeadwayIndex = shownTimes.findIndex((time) => time >= now);
    const nextArrival = shownTimes[nextHeadwayIndex];
    const subsequentArrival = shownTimes[nextHeadwayIndex + 1];
    const subsequentHeadway = subsequentArrival - nextArrival;
    const waitWidth = (50 * subsequentHeadway) / halfInterval;
    const waitLeft = 50 * (1 + (nextArrival - now) / halfInterval);
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
    if (eitherJourneyStartsWithRegionalRail(baseline, enhanced)) {
        return (
            <ComparisonRow
                title={`Missed your train?`}
                baseline={<FrequencyInfo journey={baseline} />}
                enhanced={<FrequencyInfo journey={enhanced} />}
            />
        );
    }
    return null;
};

export default FrequencyComparison;
