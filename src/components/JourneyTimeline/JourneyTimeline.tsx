import React, { useState } from "react";
import classNames from "classnames";
import { Button } from "@ariakit/react/button";
import { BsChevronExpand } from "react-icons/bs";

import { StationName } from "components";
import { JourneySegment, JourneyTransferSegment, JourneyTravelSegment } from "types";
import { stringifyTime as globalStringifyTime, MINUTE } from "time";

import styles from "./JourneyTimeline.module.scss";
import { getColorForRouteId, textColor } from "routes";
import { pluralize } from "strings";

type Props = {
    segments: JourneySegment[];
};

const desiredStationSpacingPx = 50;
const expandControlSpacingPx = 100;

const stringifyTime = (time) => globalStringifyTime(time, { use12Hour: true });

const getSegmentHeight = (segment: JourneySegment) => {
    const elapsedSeconds =
        segment.kind === "travel"
            ? segment.endTime - segment.startTime
            : segment.waitDuration + segment.walkDuration;
    const numPassedStations = segment.kind === "travel" && segment.passedStations.length;
    const elapsedMinutes = elapsedSeconds / MINUTE;
    const minSafeHeight = numPassedStations ? numPassedStations * 20 + 50 : 0;
    return Math.max(minSafeHeight, elapsedMinutes * 4.5 + 50);
};

const TravelSegment = (props: { segment: JourneyTravelSegment }) => {
    const { segment } = props;
    const { startStation, endStation, startTime, endTime, routeId } = segment;
    const color = getColorForRouteId(routeId);
    const height = getSegmentHeight(segment);
    const canCollapse = height / segment.passedStations.length < desiredStationSpacingPx;
    const [expanded, setExpanded] = useState(!canCollapse);

    const renderInnerStations = (stations: JourneyTravelSegment["passedStations"]) => {
        return stations.map((passedStation) => {
            return (
                <div key={passedStation.station.id} className={styles.travelSegmentPassedStation}>
                    <div className="circle" />
                    <div className="label">
                        <StationName station={passedStation.station} onRouteId={routeId} />
                    </div>
                </div>
            );
        });
    };

    const renderExpandControl = (numHiddenStations: number) => {
        return (
            <Button className={styles.travelStationExpandControl} onClick={() => setExpanded(true)}>
                <div className="circle">
                    <BsChevronExpand strokeWidth={1} size={18} />
                </div>
                <div className="label">Show {numHiddenStations} more</div>
            </Button>
        );
    };

    const renderInnerContents = () => {
        const { passedStations } = segment;
        if (expanded) {
            return renderInnerStations(passedStations);
        }
        const availableSpaceForShownStations = height - expandControlSpacingPx;
        const shownStationsPerSide = Math.floor(
            availableSpaceForShownStations / desiredStationSpacingPx
        );
        const startStations = passedStations.slice(0, shownStationsPerSide);
        const endStations = passedStations.slice(passedStations.length - shownStationsPerSide);
        const hiddenStationsCount =
            passedStations.length - (startStations.length + endStations.length);
        if (hiddenStationsCount < 3 || shownStationsPerSide === 0) {
            return renderInnerStations(passedStations);
        }
        return (
            <>
                {renderInnerStations(startStations)}
                {renderExpandControl(hiddenStationsCount)}
                {renderInnerStations(endStations)}
            </>
        );
    };

    const renderEndpoint = (station, time) => {
        return (
            <div className={styles.travelSegmentEndpoint}>
                <div className="circle" />
                <div className="label">
                    <StationName station={station} onRouteId={routeId} />
                    <div className="time">{stringifyTime(time)}</div>
                </div>
            </div>
        );
    };

    return (
        <div className={classNames(styles.travelSegment, textColor(color))}>
            <div className="stem" />
            {renderEndpoint(startStation, startTime)}
            <div className="inner" style={expanded ? { minHeight: height } : { height }}>
                {renderInnerContents()}
            </div>
            {renderEndpoint(endStation, endTime)}
        </div>
    );
};

const TransferSegment = (props: {
    isStart: boolean;
    isEnd: boolean;
    segment: JourneyTransferSegment;
}) => {
    const { segment, isStart, isEnd } = props;
    const { startTime, endTime, walkDuration, waitDuration, isWaitAtDestination } = segment;
    const walkDurationRounded = Math.floor(walkDuration / MINUTE);
    const waitDurationRounded = Math.floor(waitDuration / MINUTE);
    if (isEnd && endTime - startTime < MINUTE * 5) {
        return null;
    }
    return (
        <div
            className={classNames(
                styles.transferSegment,
                isStart && "start",
                (isStart || isEnd) && "start-end"
            )}
            style={{ minHeight: getSegmentHeight(segment) }}
        >
            {isStart && (
                <div className="start-end-point">
                    <div className="circle" />
                    <div className="label">
                        <div className="name">Start</div>
                        <div className="time">{stringifyTime(startTime)}</div>
                    </div>
                </div>
            )}
            <div className="stem" />
            <div className="label">
                {walkDurationRounded > 0 && <div>{walkDurationRounded} minute transfer</div>}
                {waitDurationRounded > 0 && (
                    <div>
                        {isWaitAtDestination ? (
                            <>
                                Arrive {waitDurationRounded}{" "}
                                {pluralize("minute", waitDurationRounded)} early
                            </>
                        ) : (
                            <>{waitDurationRounded} minute wait</>
                        )}
                    </div>
                )}
            </div>
            {isEnd && (
                <div className="start-end-point">
                    <div className="circle" />
                    <div className="label">
                        <div className="name">End</div>
                        <div className="time">{stringifyTime(endTime)}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

const JourneyTimeline = (props: Props) => {
    const { segments } = props;
    if (segments.length === 0) {
        return null;
    }
    return (
        <div className={styles.journeyTimeline}>
            {segments.map((segment, index) => {
                if (segment.kind === "travel") {
                    return <TravelSegment key={index} segment={segment} />;
                }
                return (
                    <TransferSegment
                        key={index}
                        segment={segment}
                        isStart={index === 0}
                        isEnd={index === segments.length - 1}
                    />
                );
            })}
        </div>
    );
};

export default JourneyTimeline;
