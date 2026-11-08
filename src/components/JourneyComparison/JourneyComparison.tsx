import React from "react";

import { JourneyInfo } from "types";
import { AmenityListing, JourneyTimeline } from "components";
import { stringifyDuration, stringifyTime } from "time";

import { ComparisonProps } from "./types";
import ComparisonRow from "./ComparisonRow";
import WaitComparison from "./WaitComparison";
import FrequencyComparison from "./FrequencyComparison";
import FareComparison from "./FareComparison";
import NoBaselineReason from "./NoBaselineReason";

import styles from "./JourneyComparison.module.scss";

const getTotalJourneyDuration = (journey: JourneyInfo) => {
    if (journey.navigationFailed) {
        return null;
    }
    const first = journey.segments[0];
    const last = journey.segments[journey.segments.length - 1];
    return last.endTime - first.startTime;
};

const renderJourneyDuration = (journey: JourneyInfo) => {
    if (journey.navigationFailed) {
        return null;
    }
    const first = journey.segments[0];
    const last = journey.segments[journey.segments.length - 1];
    return (
        stringifyTime(first.startTime, { use12Hour: true }) +
        "—" +
        stringifyTime(last.endTime, { use12Hour: true })
    );
};

const getStartTime = (journey: JourneyInfo) => {
    if (!journey || journey.navigationFailed) {
        return null;
    }
    const first = journey.segments[0];
    return stringifyTime(first.startTime, { use12Hour: true });
};

const renderTotalTime = (
    journey: JourneyInfo,
    totalDuration: null | number,
    enhanced: JourneyInfo
) => {
    if (journey.navigationFailed) {
        return (
            <>
                <div className="duration">
                    <div className="bubble red">No train</div>
                </div>
                <NoBaselineReason enhanced={enhanced} />
            </>
        );
    }
    return (
        <>
            <div className="duration">
                {totalDuration ? stringifyDuration(totalDuration) : "---"}
            </div>
            <div className="secondary">{renderJourneyDuration(journey)}</div>
        </>
    );
};

const renderNextTrain = (journey: JourneyInfo) => {
    const startTime = getStartTime(journey);
    return <div className="duration">{startTime ? "Departs at " + startTime : "No train"}</div>;
};

const renderTimeline = (journey: JourneyInfo) => {
    if (journey.navigationFailed) {
        return <div className={styles.noRouteTimeline}>No route</div>;
    }
    return <JourneyTimeline segments={journey.segments} />;
};

const JourneyComparison = (props: ComparisonProps) => {
    const { baseline, enhanced, departAfter } = props;

    const baselineTotalDuration = getTotalJourneyDuration(baseline);
    const enhancedTotalDuration = getTotalJourneyDuration(enhanced);
    const enhancedTotalFraction =
        baselineTotalDuration && enhancedTotalDuration && baselineTotalDuration > 0
            ? 1 - enhancedTotalDuration / baselineTotalDuration
            : 0;
    const showDelayRow =
        !baseline.navigationFailed &&
        enhanced.amenities.includes("electricTrains") &&
        !baseline.amenities.includes("electricTrains");
    const showWaitRow = !baseline.reverse && !departAfter;
    const amenitiesDiff = enhanced.amenities.filter((a) => !baseline.amenities.includes(a));

    return (
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
                title="Total time"
                baseline={renderTotalTime(baseline, baselineTotalDuration, enhanced)}
                enhanced={
                    <>
                        <div className="duration">
                            {enhancedTotalDuration
                                ? stringifyDuration(enhancedTotalDuration)
                                : "---"}
                            {enhancedTotalFraction > 0 && (
                                <div className="bubble offset-left green">
                                    {Math.round(100 * enhancedTotalFraction)}% faster
                                </div>
                            )}
                        </div>
                        <div className="secondary">{renderJourneyDuration(enhanced)}</div>
                    </>
                }
            />
            {departAfter && (
                <ComparisonRow
                    title="Next train"
                    baseline={renderNextTrain(baseline)}
                    enhanced={renderNextTrain(enhanced)}
                />
            )}
            {showWaitRow && <WaitComparison {...props} />}
            {amenitiesDiff.length > 0 && (
                <ComparisonRow
                    title="Your ride"
                    baseline={
                        baseline.navigationFailed ? (
                            <AmenityListing noService />
                        ) : (
                            <AmenityListing absent={amenitiesDiff} />
                        )
                    }
                    enhanced={<AmenityListing present={amenitiesDiff} />}
                />
            )}
            <FareComparison {...props} />
            {showDelayRow && (
                <ComparisonRow
                    title="Reliability"
                    baseline={
                        <div>
                            <div className="bubble red">Low</div>
                            <div className="secondary">
                                An MBTA commuter rail train breaks down once every 5,000 miles.
                            </div>
                        </div>
                    }
                    enhanced={
                        <div>
                            <div className="bubble green">30x higher</div>
                            <div className="secondary">
                                Electric trains break down less than once every 150,000 miles.
                            </div>
                        </div>
                    }
                />
            )}
            <FrequencyComparison {...props} />
            <ComparisonRow
                title="Your trip"
                baseline={renderTimeline(baseline)}
                enhanced={renderTimeline(enhanced)}
            />
        </div>
    );
};

export default JourneyComparison;
