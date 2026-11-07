import React from "react";

import { JourneyInfo, JourneyStation, JourneyTravelSegment } from "types";
import { isInfillStation } from "stations";

type Props = {
    enhanced: JourneyInfo;
};

// Today's network can't route a trip that starts or ends at a station only Regional Rail adds
const getNewStation = (enhanced: JourneyInfo): null | JourneyStation => {
    const travelSegments = enhanced.segments.filter(
        (seg): seg is JourneyTravelSegment => seg.kind === "travel"
    );
    const first = travelSegments[0];
    const last = travelSegments[travelSegments.length - 1];
    if (first && isInfillStation(first.startStation.id, first.routeId)) {
        return first.startStation;
    }
    if (last && isInfillStation(last.endStation.id, last.routeId)) {
        return last.endStation;
    }
    return null;
};

// Explains, under the "No train" bubble, why today's Commuter Rail has no trip
const NoBaselineReason = (props: Props) => {
    const { enhanced } = props;
    const newStation = getNewStation(enhanced);
    if (newStation) {
        return (
            <div className="secondary">
                {newStation.name} doesn&apos;t have a Commuter Rail stop today.
            </div>
        );
    }
    return <div className="secondary">No Commuter Rail train runs for this trip at this time.</div>;
};

export default NoBaselineReason;
