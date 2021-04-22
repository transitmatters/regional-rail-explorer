import React from "react";
import classNames from "classnames";

import {
    JourneySegment,
    JourneyStation,
    JourneyTransferSegment,
    JourneyTravelSegment,
} from "types";
import { stringifyTime as globalStringifyTime, MINUTE } from "time";

import styles from "./JourneyTimeline.module.scss";
import { getColorForRouteId, textColor } from "routes";
import { getLinkToStation } from "stations";

type Props = {
    journey: JourneySegment[];
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

    const renderStationName = (station: JourneyStation) => {
        return (
            <a href={getLinkToStation(station)} className={styles.stationName}>
                {station.name}
            </a>
        );
    };

    const renderInnerContents = () => {
        return segment.passedStations.map((passedStation) => {
            return (
                <div key={passedStation.station.id} className={styles.travelSegmentPassedStation}>
                    <div className="circle" />
                    <div className="label">{renderStationName(passedStation.station)}</div>
                </div>
            );
        });
    };

    const renderEndpoint = (station, time) => {
        return (
            <div className={styles.travelSegmentEndpoint}>
                <div className="circle" />
                <div className="label">
                    <div className="name">{renderStationName(station)}</div>
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
            <div className="stem" />
            {renderEndpoint(fromStation, departureTime)}
            <div className="inner">{renderInnerContents()}</div>
            {renderEndpoint(toStation, arrivalTime)}
        </div>
    );
};

const TransferSegment = (props: { isStart: boolean; segment: JourneyTransferSegment }) => {
    const { segment, isStart } = props;
    const transferDurationRounded = Math.floor(segment.transferDuration / MINUTE);
    const waitDurationRounded = Math.floor(segment.waitDuration / MINUTE);
    return (
        <div
            className={classNames(styles.transferSegment, isStart && "start")}
            style={{ minHeight: getSegmentHeight(segment) }}
        >
            {isStart && (
                <div className="start-point">
                    <div className="circle" />
                    <div className="label">
                        <div className="name">Start</div>
                        <div className="time">{stringifyTime(segment.startTime)}</div>
                    </div>
                </div>
            )}
            <div className="stem" />
            <div className="label">
                {transferDurationRounded > 0 && (
                    <div>{transferDurationRounded} minute transfer</div>
                )}
                {waitDurationRounded > 0 && <div>{waitDurationRounded} minute wait</div>}
            </div>
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
                return <TransferSegment key={index} segment={segment} isStart={index === 0} />;
            })}
        </div>
    );
};

export default JourneyTimeline;
