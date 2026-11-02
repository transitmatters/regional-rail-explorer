import React from "react";

import { JourneyInfo, JourneySegment } from "types";
import { isRegionalRailRouteId } from "routes";

import { ComparisonProps } from "./types";
import ComparisonRow from "./ComparisonRow";

type FareRegime = "subway" | "commuterRail";

type Fare = { regime: FareRegime; routeId: string };

const getNonUnifiedFareSegmentsCount = (journey: JourneyInfo) => {
    const fares = journey.segments.reduce(
        (partialFares: Fare[], journeySegment: JourneySegment) => {
            if (journeySegment.kind === "transfer") {
                return partialFares;
            }
            const previousFare = partialFares[partialFares.length - 1];
            const { routeId } = journeySegment;
            const regime: FareRegime = isRegionalRailRouteId(routeId) ? "commuterRail" : "subway";
            if (regime === "subway" && previousFare?.regime === "subway") {
                return partialFares;
            }
            // Changing trains within one Commuter Rail line is covered by the same ticket
            if (regime === "commuterRail" && previousFare?.routeId === routeId) {
                return partialFares;
            }
            return [...partialFares, { regime, routeId }];
        },
        []
    );
    const segments = fares.map((fare) => fare.regime);
    return {
        subway: segments.filter((s) => s === "subway").length,
        commuterRail: segments.filter((s) => s === "commuterRail").length,
    };
};

const nlTimesString = (n: number) => {
    if (n === 1) {
        return "once";
    } else if (n === 2) {
        return "twice";
    }
    return `${n} times`;
};

const FareComparison = (props: ComparisonProps) => {
    const { baseline } = props;
    if (baseline.navigationFailed) {
        return null;
    }
    const { subway, commuterRail } = getNonUnifiedFareSegmentsCount(baseline);
    const total = subway + commuterRail;

    if (total < 2) {
        return null;
    }

    const commuterRailRidesString = `Pay ${nlTimesString(commuterRail)} to ride the Commuter Rail`;
    const subwayRidesString = subway > 0 ? ` and ${nlTimesString(subway)} to ride the subway` : "";

    const baselineFareInfo = (
        <div>
            <div className="bubble red">{total} fares</div>
            <div className="secondary">
                {commuterRailRidesString}
                {subwayRidesString}.
            </div>
        </div>
    );

    const enhancedFareInfo = (
        <div>
            <div className="bubble green">One fare</div>
            <div className="secondary">
                Pay one fare based on distance traveled across all MBTA services.
            </div>
        </div>
    );

    return (
        <ComparisonRow title="Your fare" baseline={baselineFareInfo} enhanced={enhancedFareInfo} />
    );
};

export default FareComparison;
