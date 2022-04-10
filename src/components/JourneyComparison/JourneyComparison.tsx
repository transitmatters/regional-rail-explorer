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

const getTotalJourneyDuration = (journey: JourneyInfo) => {
    if (journey.navigationFailed) {
        return 0;
    }
    const first = journey.segments[0];
    const last = journey.segments[journey.segments.length - 1];
    return last.endTime - first.startTime;
};

const renderJourneyDuration = (journey: JourneyInfo) => {
    if (journey.navigationFailed) {
        return "No route found";
    }
    const first = journey.segments[0];
    const last = journey.segments[journey.segments.length - 1];
    return (
        stringifyTime(first.startTime, { use12Hour: true }) +
        "—" +
        stringifyTime(last.endTime, { use12Hour: true })
    );
};

const JourneyComparison = (props: ComparisonProps) => {
    const { baseline, enhanced } = props;

    const baselineTotalDuration = getTotalJourneyDuration(baseline);
    const enhancedTotalDuration = getTotalJourneyDuration(enhanced);
    const enhancedTotalFraction =
        baselineTotalDuration > 0 ? 1 - enhancedTotalDuration / baselineTotalDuration : 0;
    const showDelayRow =
        enhanced.amenities.includes("electricTrains") &&
        !baseline.amenities.includes("electricTrains");
    const showWaitRow = !baseline.reverse;
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
                        <div className="duration">{stringifyDuration(baselineTotalDuration)}</div>
                        <div className="secondary">{renderJourneyDuration(baseline)}</div>
                    </>
                }
                enhanced={
                    <>
                        <div className="duration">
                            {stringifyDuration(enhancedTotalDuration)}
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
                baseline={<JourneyTimeline segments={baseline.segments} />}
                enhanced={<JourneyTimeline segments={enhanced.segments} />}
            />
        </div>
    );
};

export default JourneyComparison;
