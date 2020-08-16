import React from "react";

import { JourneyInfo, JourneyTravelSegment, JourneyTransferSegment, CrowdingLevel } from "types";
import { stringifyDuration } from "time";
import { isRegionalRail } from "routes";
import AmenityListing from "components/AmenityListing/AmenityListing";
import JourneyTimeline from "components/JourneyTimeline/JourneyTimeline";

import styles from "./JourneyComparison.module.scss";
import CrowdingIllustration from "components/CrowdingIllustration/CrowdingIllustration";
import { joinOxford } from "strings";

interface Props {
    baseline: JourneyInfo;
    enhanced: JourneyInfo;
}

interface RowProps {
    title: string;
    baseline: React.ReactNode;
    enhanced: React.ReactNode;
}

const Row = (props: RowProps) => {
    const { title, baseline, enhanced } = props;
    return (
        <div className={styles.row}>
            <div className="title">{title}</div>
            <div className="baseline">{baseline}</div>
            <div className="enhanced">{enhanced}</div>
        </div>
    );
};

interface WaitInfoProps {
    journey: JourneyInfo;
    compareFavorablyTo?: JourneyInfo;
}

const WaitInfo = (props: WaitInfoProps) => {
    const { journey, compareFavorablyTo } = props;
    const waitDuration = getRegionalRailWaitDuration(journey);
    const unfavorableWaitDuration =
        compareFavorablyTo && getRegionalRailWaitDuration(compareFavorablyTo);
    const favorableWaitFraction = compareFavorablyTo && 1 - waitDuration / unfavorableWaitDuration;
    const worstCrowdingStations = journey.platformCrowding.reduce((worst, next) => {
        if (worst.length === 0 || next.crowdingLevel > worst[0].crowdingLevel) {
            return [...worst, next];
        }
        return worst;
    }, []);
    const worstCrowdingLevel =
        worstCrowdingStations.length > 0 && worstCrowdingStations[0].crowdingLevel;
    return (
        <>
            <div className="wait-summary">
                {stringifyDuration(waitDuration)} waiting for Regional Rail trains
                {favorableWaitFraction > 0 && (
                    <div className="bubble offset-left green">
                        {Math.round(100 * favorableWaitFraction)}% less
                    </div>
                )}
            </div>
            <div className="crowding-wrapper">
                <CrowdingIllustration
                    crowding={15 * worstCrowdingLevel}
                    height={30}
                    perLayer={15}
                />
                {worstCrowdingLevel > CrowdingLevel.Medium && (
                    <div className="explanation">
                        Due to long wait times, the platform is very crowded at{" "}
                        {joinOxford(worstCrowdingStations.map((wcs) => wcs.stationName))}.
                    </div>
                )}
            </div>
        </>
    );
};

const getTotalJourneyDuration = (journey: JourneyInfo) => {
    const first = journey.segments[0] as JourneyTransferSegment;
    const last = journey.segments[journey.segments.length - 1] as JourneyTravelSegment;
    return last.arrivalTime - first.startTime;
};

const getRegionalRailWaitDuration = (journey: JourneyInfo) => {
    return journey.segments.reduce(
        ({ previousSegment, duration }, segment) => {
            if (segment.type === "travel" && isRegionalRail(segment.routeId)) {
                return {
                    duration: duration + (previousSegment as JourneyTransferSegment).waitDuration,
                    previousSegment: segment,
                };
            }
            return { duration, previousSegment: segment };
        },
        { duration: 0, previousSegment: null }
    ).duration;
};

const JourneyComparison = (props: Props) => {
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
            <Row
                title="Total time"
                baseline={stringifyDuration(baselineTotalDuration)}
                enhanced={
                    <>
                        {stringifyDuration(enhancedTotalDuration)}
                        {enhancedTotalFraction > 0 && (
                            <div className="bubble offset-left green">
                                {Math.round(100 * enhancedTotalFraction)}% faster
                            </div>
                        )}
                    </>
                }
            />
            <Row
                title="Your wait"
                baseline={<WaitInfo journey={baseline} />}
                enhanced={<WaitInfo journey={enhanced} compareFavorablyTo={baseline} />}
            />
            <Row
                title="Your ride"
                baseline={<AmenityListing absent={baselineMissingAmenities} />}
                enhanced={<AmenityListing present={enhanced.amenities} />}
            />
            {showDelayRow && (
                <Row
                    title="Chance of delay"
                    baseline={
                        <div className="delay-info">
                            <div className="bubble red">High</div>
                            <div>
                                A diesel train breaks down, on average, once every 5,000 miles.
                            </div>
                        </div>
                    }
                    enhanced={
                        <div className="delay-info">
                            <div className="bubble green">5x lower</div>
                            <div>Electric trains break down less than once every 25,000 miles.</div>
                        </div>
                    }
                />
            )}
            <Row
                title="Your trip"
                baseline={<JourneyTimeline journey={baseline.segments} />}
                enhanced={<JourneyTimeline journey={enhanced.segments} />}
            />
        </div>
    );
};

export default JourneyComparison;
