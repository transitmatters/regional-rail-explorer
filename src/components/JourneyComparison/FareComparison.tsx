import React from "react";

import { FareLeg, JourneyFare } from "types";
import { formatFare } from "fares";

import { ComparisonProps } from "./types";
import ComparisonRow from "./ComparisonRow";

const legNames: Record<FareLeg["kind"], string> = {
    commuterRail: "Commuter Rail",
    subway: "subway",
};

const describeSeparateFares = (fare: JourneyFare) => {
    if (fare.legs.length === 1) {
        return `One ${legNames[fare.legs[0].kind]} fare.`;
    }
    const breakdown = fare.legs
        .map((leg) => `${legNames[leg.kind]} ${formatFare(leg.amount)}`)
        .join(" + ");
    return `Pay ${fare.legs.length} fares: ${breakdown}.`;
};

const describeUnifiedFare = (fare: JourneyFare) => {
    if (fare.legs.every((leg) => leg.kind === "subway")) {
        return "One subway fare.";
    }
    if (fare.offPeakDiscount) {
        return "One fare for the whole trip, including the subway. Half price off-peak.";
    }
    return "One fare for the whole trip, including the subway. Full price at peak times.";
};

const renderPrice = (amount: number, color: null | "red" | "green") => {
    if (color) {
        return <div className={`bubble ${color}`}>{formatFare(amount)}</div>;
    }
    return <div className="duration">{formatFare(amount)}</div>;
};

const FareComparison = (props: ComparisonProps) => {
    const { baseline, enhanced } = props;
    if (!baseline.fare || !enhanced.fare) {
        return null;
    }
    const savings = baseline.fare.total - enhanced.fare.total;

    const baselineFareInfo = (
        <div>
            {renderPrice(baseline.fare.total, savings > 0 ? "red" : null)}
            <div className="secondary">{describeSeparateFares(baseline.fare)}</div>
        </div>
    );

    const enhancedFareInfo = (
        <div>
            {renderPrice(enhanced.fare.total, savings > 0 ? "green" : null)}
            <div className="secondary">{describeUnifiedFare(enhanced.fare)}</div>
        </div>
    );

    return (
        <ComparisonRow title="Your fare" baseline={baselineFareInfo} enhanced={enhancedFareInfo} />
    );
};

export default FareComparison;
