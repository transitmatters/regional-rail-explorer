import React from "react";

import { JourneyInfo } from "types";
import { AmenityListing, JourneyTimeline } from "components";
import { stringifyDuration, stringifyTime } from "time";

import { ComparisonProps } from "./types";
import ComparisonRow from "./ComparisonRow";
import WaitComparison from "./WaitComparison";
import FrequencyComparison from "./FrequencyComparison";
import FareComparison from "./FareComparison";

import styles from "./JourneyComparison.module.scss";

const getTotalJourneyDuration = (journey: JourneyInfo, departAfter: boolean) => {
    if (journey.navigationFailed) {
        return null;
    }
    const first =
        !departAfter || journey.segments[0].kind === "travel"
            ? journey.segments[0]
            : journey.segments[1];
    const last = journey.segments[journey.segments.length - 1];
    return last.endTime - first.startTime;
};

const renderJourneyDuration = (journey: JourneyInfo, departAfter: boolean) => {
    if (journey.navigationFailed) {
        return "No route found";
    }
    const first =
        !departAfter || journey.segments[0].kind === "travel"
            ? journey.segments[0]
            : journey.segments[1];
    const last = journey.segments[journey.segments.length - 1];
    return (
        stringifyTime(first.startTime, { use12Hour: true }) +
        "—" +
        stringifyTime(last.endTime, { use12Hour: true })
    );
};

const getStartTime = (journey: JourneyInfo, departAfter: boolean) => {
    if (!journey || journey.navigationFailed) {
        return "--:--";
    }
    const first =
        !departAfter || journey.segments[0].kind === "travel"
            ? journey.segments[0]
            : journey.segments[1];
    return stringifyTime(first.startTime, { use12Hour: true });
};

const JourneyComparison = (props: ComparisonProps) => {
    const { baseline, enhanced, departAfter } = props;

    const baselineTotalDuration = getTotalJourneyDuration(baseline, departAfter);
    const enhancedTotalDuration = getTotalJourneyDuration(enhanced, departAfter);
    const enhancedTotalFraction =
        baselineTotalDuration && enhancedTotalDuration && baselineTotalDuration > 0
            ? 1 - enhancedTotalDuration / baselineTotalDuration
            : 0;
    const showDelayRow =
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
                baseline={
                    <>
                        <div className="duration">
                            {baselineTotalDuration
                                ? stringifyDuration(baselineTotalDuration)
                                : "---"}
                        </div>
                        <div className="secondary">
                            {renderJourneyDuration(baseline, departAfter)}
                        </div>
                    </>
                }
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
                        <div className="secondary">
                            {renderJourneyDuration(enhanced, departAfter)}
                        </div>
                    </>
                }
            />
            {departAfter && (
                <ComparisonRow
                    title="Next train"
                    baseline={
                        <>
                            <div className="duration">
                                {"Departs at " + getStartTime(baseline, departAfter)}
                            </div>
                        </>
                    }
                    enhanced={
                        <>
                            <div className="duration">
                                {"Departs at " + getStartTime(enhanced, departAfter)}
                            </div>
                        </>
                    }
                />
            )}
            {showWaitRow && <WaitComparison {...props} />}
            {amenitiesDiff.length > 0 && (
                <ComparisonRow
                    title="Your ride"
                    baseline={<AmenityListing absent={amenitiesDiff} />}
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
                baseline={
                    <JourneyTimeline
                        segments={
                            !departAfter ||
                            baseline.segments.length === 0 ||
                            baseline.segments[0].kind === "travel"
                                ? baseline.segments
                                : baseline.segments.slice(1)
                        }
                    />
                }
                enhanced={
                    <JourneyTimeline
                        segments={
                            !departAfter ||
                            enhanced.segments.length === 0 ||
                            enhanced.segments[0].kind === "travel"
                                ? enhanced.segments
                                : enhanced.segments.slice(1)
                        }
                    />
                }
            />
        </div>
    );
};

export default JourneyComparison;
