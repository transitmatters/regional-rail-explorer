import React from "react";

import { JourneyInfo, CrowdingLevel, JourneySegment, JourneyStation } from "types";
import { CrowdingIllustration } from "components";

import { stringifyDuration } from "time";
import { isRegionalRailRouteId } from "routes";
import { joinOxford } from "strings";

import { ComparisonProps } from "./types";
import ComparisonRow from "./ComparisonRow";

interface WaitInfoProps {
    journey: JourneyInfo;
    compareFavorablyTo?: JourneyInfo;
    isRegionalRail?: boolean;
}

const getRegionalRailWaitDuration = (journey: JourneyInfo) => {
    return journey.segments.reduce(
        ({ previousSegment, duration }, segment) => {
            if (
                segment.kind === "travel" &&
                previousSegment?.kind === "transfer" &&
                isRegionalRailRouteId(segment.routeId)
            ) {
                return {
                    duration: duration + previousSegment.waitDuration,
                    previousSegment: segment,
                };
            }
            return { duration, previousSegment: segment };
        },
        { duration: 0, previousSegment: null as null | JourneySegment }
    ).duration;
};

const WaitInfo = (props: WaitInfoProps) => {
    const { journey, compareFavorablyTo, isRegionalRail } = props;
    const serviceType = isRegionalRail ? "Regional Rail" : "Commuter Rail";
    const waitDuration = getRegionalRailWaitDuration(journey);
    const unfavorableWaitDuration = (compareFavorablyTo &&
        getRegionalRailWaitDuration(compareFavorablyTo))!;
    const favorableWaitFraction = compareFavorablyTo && 1 - waitDuration / unfavorableWaitDuration;
    return (
        <>
            <div className="duration">
                {stringifyDuration(waitDuration)} waiting for {serviceType} trains
                {favorableWaitFraction! > 0 && (
                    <div className="bubble offset-left green">
                        {Math.round(100 * favorableWaitFraction!)}% less
                    </div>
                )}
            </div>
        </>
    );
};

const WaitComparison = (props: ComparisonProps) => {
    const { baseline, enhanced } = props;
    return (
        <ComparisonRow
            title="Your wait"
            baseline={<WaitInfo journey={baseline} />}
            noPadding
            enhanced={
                <WaitInfo journey={enhanced} compareFavorablyTo={baseline} isRegionalRail={true} />
            }
        />
    );
};

export default WaitComparison;
