import React, { useMemo } from "react";
import classNames from "classnames";

import { useSvgLayout } from "hooks";
import { Duration } from "types";

import { prerenderNetwork } from "./network";
import { HOUR, MINUTE } from "time";

type RouteTrips = {
    durationHours: Duration;
    headwayMinutes: Duration;
    offsetMinutes: Duration;
    reversed?: boolean;
};

export type Props = {
    curveRadius?: number;
    elapsed?: Duration;
    trainClassName?: string;
    trainAtTerminalClassName?: string;
    lineClassName?: string;
    height?: number;
    className?: string;
};

const tripsByRoutePatternId: Record<string, RouteTrips> = {
    // Northside
    newburyport: {
        durationHours: 1,
        headwayMinutes: 20,
        offsetMinutes: 0,
    },
    rockport: {
        durationHours: 0.75,
        headwayMinutes: 20,
        offsetMinutes: 15,
        reversed: true,
    },
    fitchburg: {
        durationHours: 1,
        headwayMinutes: 15,
        offsetMinutes: 0,
    },
    lowell: {
        durationHours: 1,
        headwayMinutes: 15,
        offsetMinutes: 10,
    },
    haverhill: {
        durationHours: 1.2,
        headwayMinutes: 15,
        offsetMinutes: 7,
    },
    // Southside
    fairmount: {
        durationHours: 0.5,
        headwayMinutes: 15,
        offsetMinutes: 3,
    },
    franklin: {
        durationHours: 1,
        headwayMinutes: 15,
        offsetMinutes: 10.5,
    },
    worcester: {
        durationHours: 1.15,
        headwayMinutes: 20,
        offsetMinutes: 8,
    },
    needham: {
        durationHours: 0.5,
        headwayMinutes: 15,
        offsetMinutes: 11,
    },
    providence: {
        durationHours: 1,
        headwayMinutes: 30,
        offsetMinutes: 0,
    },
    stoughton: {
        durationHours: 1.1,
        headwayMinutes: 30,
        offsetMinutes: 15,
    },
    kingston: {
        durationHours: 1.1,
        headwayMinutes: 30,
        offsetMinutes: 0,
    },
    plymouth: {
        durationHours: 1.1,
        headwayMinutes: 30,
        offsetMinutes: 7.5,
    },
    greenbush: {
        durationHours: 0.75,
        headwayMinutes: 30,
        offsetMinutes: 15,
    },
    middleborough: {
        durationHours: 1,
        headwayMinutes: 30,
        offsetMinutes: 2,
    },
};

const getTripsProgress = (trips: RouteTrips, networkElapsed: Duration, buffer: Duration = 0) => {
    const { durationHours, headwayMinutes, offsetMinutes } = trips;
    const offset = offsetMinutes * MINUTE;
    const headway = headwayMinutes * MINUTE;
    const duration = durationHours * HOUR;
    const tripsProgress: { index: number; progress: number }[] = [];
    const localNow = networkElapsed - offset;
    const numTrips = Math.ceil(duration / headway);
    const period = numTrips * headway;
    for (let index = 0; index < numTrips; index++) {
        const offset = index * headway;
        const now = localNow - offset;
        const departureNumber = Math.floor(now / period);
        const departedAt = period * departureNumber;
        const elapsed = now - departedAt;
        const visible = elapsed >= -buffer && elapsed <= duration + buffer;
        if (visible) {
            const elapsed = now - departedAt;
            const progress = elapsed / duration;
            tripsProgress.push({ index, progress });
            tripsProgress.push({ index: numTrips + index, progress: 1 - progress });
        }
    }
    return tripsProgress;
};

export const NetworkVisualizer: React.FunctionComponent<Props> = (props) => {
    const {
        className,
        curveRadius,
        elapsed,
        lineClassName,
        trainClassName,
        trainAtTerminalClassName,
        height = 800,
    } = props;
    const { pathDirective, routePatterns } = useMemo(
        () => prerenderNetwork(curveRadius),
        [curveRadius]
    );
    const svgProps = useSvgLayout();

    const renderTrains = () => {
        if (typeof elapsed !== "number") {
            return null;
        }
        return Object.entries(tripsByRoutePatternId).map(([key, trips]) => {
            const routePattern = routePatterns[key];
            if (routePattern) {
                const tripsProgress = getTripsProgress(trips, elapsed);
                const { progressPathInterpolator } = routePattern;
                return (
                    <React.Fragment key={key}>
                        {tripsProgress.map(({ progress, index }) => {
                            const normalizedProgress = Math.min(1, Math.max(progress, 0));
                            const pos = progressPathInterpolator(normalizedProgress);
                            return (
                                <g key={index} transform={`translate(${pos.x}, ${pos.y})`}>
                                    <circle
                                        cx={0}
                                        cy={0}
                                        r={4}
                                        className={classNames(
                                            trainClassName,
                                            normalizedProgress !== progress &&
                                                trainAtTerminalClassName
                                        )}
                                    />
                                </g>
                            );
                        })}
                    </React.Fragment>
                );
            }
            return null;
        });
    };

    return (
        <svg {...svgProps} style={{ height }} aria-hidden="true" className={className}>
            <path
                d={pathDirective}
                fill="transparent"
                strokeWidth={4}
                stroke="black"
                className={lineClassName}
            />
            {renderTrains()}
        </svg>
    );
};
