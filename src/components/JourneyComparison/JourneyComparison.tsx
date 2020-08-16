import React from "react";

import { JourneyInfo, JourneyTravelSegment, JourneyTransferSegment } from "types";
import { AmenityListing, JourneyTimeline } from "components";
import { stringifyDuration } from "time";

import { ComparisonProps } from "./types";
import ComparisonRow from "./ComparisonRow";
import WaitComparison from "./WaitComparison";
import FrequencyComparison from "./FrequencyComparison";

import styles from "./JourneyComparison.module.scss";

const getTotalJourneyDuration = (journey: JourneyInfo) => {
    const first = journey.segments[0] as JourneyTransferSegment;
    const last = journey.segments[journey.segments.length - 1] as JourneyTravelSegment;
    return last.arrivalTime - first.startTime;
};

const JourneyComparison = (props: ComparisonProps) => {
    const { baseline, enhanced } = props;

    const baselineTotalDuration = getTotalJourneyDuration(baseline);
    const enhancedTotalDuration = getTotalJourneyDuration(enhanced);
    const enhancedTotalFraction = 1 - enhancedTotalDuration / baselineTotalDuration;

    const showDelayRow =
        enhanced.amenities.includes("electric-trains") &&
        !baseline.amenities.includes("electric-trains");

    const baselineMissingAmenities = enhanced.amenities.filter(
        (amenity) => !baseline.amenities.includes(amenity)
    );

    return (
        <div className={styles.journeyComparison}>
            <ComparisonRow
                baseline={baseline.scenario.name}
                enhanced={enhanced.scenario.name}
                isHeader
            />
            <ComparisonRow
                title="Total time"
                baseline={
                    <span className="duration">{stringifyDuration(baselineTotalDuration)}</span>
                }
                enhanced={
                    <div>
                        <span className="duration">{stringifyDuration(enhancedTotalDuration)}</span>
                        {enhancedTotalFraction > 0 && (
                            <div className="bubble offset-left green">
                                {Math.round(100 * enhancedTotalFraction)}% faster
                            </div>
                        )}
                    </div>
                }
            />
            <WaitComparison {...props} />
            <ComparisonRow
                title="Your ride"
                baseline={<AmenityListing absent={baselineMissingAmenities} />}
                enhanced={<AmenityListing present={enhanced.amenities} />}
            />
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
                baseline={<JourneyTimeline journey={baseline.segments} />}
                enhanced={<JourneyTimeline journey={enhanced.segments} />}
            />
        </div>
    );
};

export default JourneyComparison;
