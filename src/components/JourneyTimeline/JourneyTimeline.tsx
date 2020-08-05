import React, { useState } from "react";
import classNames from "classnames";

import { NetworkTime } from "types";
import { stringifyTime as globalStringifyTime, MINUTE } from "time";

import styles from "./JourneyTimeline.module.scss";
import { getColorForRouteId, textColor } from "colorClasses";

interface JourneyStation {
    id: string;
    name: string;
}

interface JourneyTravelSegment {
    type: "travel";
    departureTime: NetworkTime;
    arrivalTime: NetworkTime;
    fromStation: JourneyStation;
    toStation: JourneyStation;
    passedStations: {
        time: NetworkTime;
        station: JourneyStation;
    }[];
    routeId: string;
}

interface JourneyTransferSegment {
    type: "transfer";
    startTime: NetworkTime;
    waitDuration: NetworkTime;
    transferDuration: NetworkTime;
}

type JourneySegment = JourneyTransferSegment | JourneyTravelSegment;

type Props = {
    journey: JourneySegment[];
    horizontal?: boolean;
};

const stringifyTime = (time) => globalStringifyTime(time, { use12Hour: true });

const getSegmentHeight = (segment: JourneySegment) => {
    const elapsedSeconds =
        segment.type === "travel"
            ? segment.arrivalTime - segment.departureTime
            : segment.waitDuration + segment.transferDuration;
    const elapsedMinutes = elapsedSeconds / MINUTE;
    return elapsedMinutes * 5 + 50;
};

const TravelSegment = (props: { segment: JourneyTravelSegment }) => {
    const { segment } = props;
    const { fromStation, toStation, departureTime, arrivalTime, routeId } = segment;
    const color = getColorForRouteId(routeId);
    const [expanded, setExpanded] = useState(false);

    const renderInnerContents = () => {
        return null;
    };

    const renderEndpoint = (station, time) => {
        return (
            <div className={styles.travelSegmentEndpoint}>
                <div className="circle" />
                <div className="label">
                    <div className="name">{station.name}</div>
                    <div className="time">{stringifyTime(time)}</div>
                </div>
            </div>
        );
    };

    return (
        <div
            className={classNames(styles.travelSegment, textColor(color))}
            style={{ minHeight: getSegmentHeight(segment) }}
        >
            <div className={"stem"} />
            {renderEndpoint(fromStation, departureTime)}
            <div className={"inner"}>
                {renderInnerContents()}
                <div className="right-hairline" />
            </div>
            {renderInnerContents()}
            {renderEndpoint(toStation, arrivalTime)}
        </div>
    );
};

const TransferSegment = (props: { segment: JourneyTransferSegment }) => {
    const { segment } = props;
    return (
        <div className={styles.transferSegment} style={{ minHeight: getSegmentHeight(segment) }}>
            <div className="stem" />
        </div>
    );
};

const JourneyTimeline = (props: Props) => {
    const { journey } = props;
    return (
        <div className={styles.journeyTimeline}>
            {journey.map((segment, index) => {
                if (segment.type === "travel") {
                    return <TravelSegment key={index} segment={segment} />;
                }
                return <TransferSegment key={index} segment={segment} />;
            })}
        </div>
    );
};

export default JourneyTimeline;
