import React, { useMemo } from "react";
import classNames from "classnames";

import { MINUTE } from "time";
import { BranchMap, NetworkTime, SerializableTrip } from "types";
import { useSvgLayout } from "hooks";
import { prerenderBranchMap, PrerenderedRoutePattern } from "diagrams";

import styles from "./RouteVisualizer.module.scss";

interface Props {
    branchMap: BranchMap;
    stationNames: Record<string, string>;
    trips?: SerializableTrip[];
    now?: NetworkTime;
    innerStrokeClassName?: string;
    lineClassName?: string;
    labelClassName?: string;
    stationClassName?: string;
    trainClassName?: string;
    trainAtTerminusClassName?: string;
}

interface BoundedTrip extends SerializableTrip {
    start: NetworkTime;
    end: NetworkTime;
}

const easeInOutQuart = (x: number) => {
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};

const createBoundedTrips = (trips: SerializableTrip[]): BoundedTrip[] => {
    return trips.map((trip) => {
        return {
            ...trip,
            start: trip.stopTimes[0].time,
            end: trip.stopTimes[trip.stopTimes.length - 1].time,
        };
    });
};

const createTripIdToRoutePatternMap = (
    trips: BoundedTrip[],
    routePatterns: PrerenderedRoutePattern[]
): Record<string, PrerenderedRoutePattern> => {
    const map: Record<string, PrerenderedRoutePattern> = {};
    const cache: Record<string, PrerenderedRoutePattern> = {};
    for (const trip of trips) {
        const stationIds = trip.stopTimes.map((st) => st.stationId);
        const tripString = stationIds.join("__");
        if (!cache[tripString]) {
            const matchingRoutePattern = routePatterns.find(
                (rp) =>
                    rp.id === trip.routePatternId ||
                    stationIds.every((stationId) =>
                        Object.keys(rp.stationOffsets).includes(stationId)
                    )
            );
            cache[tripString] = matchingRoutePattern;
        }
        map[trip.id] = cache[tripString];
    }
    return map;
};

const RouteVisualizer = (props: Props) => {
    const {
        branchMap,
        stationNames,
        trips: preboundedTrips,
        now,
        innerStrokeClassName,
        lineClassName = styles.line,
        stationClassName = styles.station,
        trainClassName = styles.train,
        labelClassName = styles.label,
        trainAtTerminusClassName,
    } = props;
    const svgProps = useSvgLayout();

    const { pathDirective, stationPositions, routePatterns } = useMemo(
        () => prerenderBranchMap(branchMap),
        [branchMap]
    );
    const trips = useMemo(() => createBoundedTrips(preboundedTrips), [preboundedTrips]);
    const tripIdsToRoutePattern = useMemo(
        () => createTripIdToRoutePatternMap(trips, Object.values(routePatterns)),
        [trips, routePatterns]
    );

    const renderLine = () => {
        return (
            <>
                <path d={pathDirective} fill="transparent" className={lineClassName} />
                {innerStrokeClassName && (
                    <path
                        d={pathDirective}
                        fill="transparent"
                        strokeWidth={3}
                        className={innerStrokeClassName}
                    />
                )}
            </>
        );
    };

    const renderStations = () => {
        return Object.entries(stationPositions).map(([stationId, pos]) => {
            const stationName = stationNames[stationId];

            const label = (
                <text
                    fontSize={10}
                    className={labelClassName}
                    textAnchor="start"
                    x={6}
                    y={6}
                    aria-hidden="true"
                    style={{ transform: "rotate(45deg)" }}
                >
                    {stationName}
                </text>
            );

            return (
                <g key={stationId} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle cx={0} cy={0} r={3} className={stationClassName} />
                    {label}
                </g>
            );
        });
    };

    const renderTrains = () => {
        const buffer = 15 * MINUTE;
        const tripsInProgress = trips.filter(
            (t) => t.start - buffer <= now && t.end + buffer >= now
        );
        return tripsInProgress.map((trip) => {
            const { stopTimes } = trip;
            const routePattern = tripIdsToRoutePattern[trip.id];
            const nextStopTimeIndex = stopTimes.findIndex((st) => st.time > now);
            const nextStopTime = stopTimes[nextStopTimeIndex] || stopTimes[stopTimes.length - 1];
            const previousStopTime = stopTimes[nextStopTimeIndex - 1] || stopTimes[0];
            const atTerminus = now > trip.end || now < trip.start;
            if (routePattern && nextStopTime && previousStopTime) {
                const { stationOffsets, pathInterpolator } = routePattern;
                const timeBetweenStations = nextStopTime.time - previousStopTime.time;
                const timeElapsedSinceStation = now - previousStopTime.time;
                const progress = Math.min(
                    Math.max(0, timeElapsedSinceStation / timeBetweenStations),
                    1
                );
                const previousOffset = stationOffsets[previousStopTime.stationId];
                const nextOffset = stationOffsets[nextStopTime.stationId];
                const offset =
                    previousOffset + (nextOffset - previousOffset) * easeInOutQuart(progress);
                const pos = pathInterpolator(offset);
                return (
                    <g key={trip.id} transform={`translate(${pos.x}, ${pos.y})`}>
                        <circle
                            cx={0}
                            cy={0}
                            r={6}
                            className={classNames(
                                trainClassName,
                                atTerminus && trainAtTerminusClassName
                            )}
                            opacity={0.5}
                        />
                    </g>
                );
            }
        });
    };

    return (
        <svg {...svgProps} aria-hidden="true">
            {renderLine()}
            {renderStations()}
            {typeof now === "number" && renderTrains()}
        </svg>
    );
};

export default RouteVisualizer;
