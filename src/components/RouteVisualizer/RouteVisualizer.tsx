import React, { useLayoutEffect, useMemo, useState } from "react";

import { BranchMap, NetworkTime, SerializableTrip } from "types";

import { prerenderLine } from "./prerender";
import { PrerenderedRoutePattern } from "./types";

export interface RouteVisualizerProps {
    branchMap: BranchMap;
    stationNames: Record<string, string>;
    trips?: SerializableTrip[];
    now?: NetworkTime;
    color?: string;
}

interface BoundedTrip extends SerializableTrip {
    start: NetworkTime;
    end: NetworkTime;
}

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

const RouteVisualizer = (props: RouteVisualizerProps) => {
    const { branchMap, stationNames, trips: preboundedTrips, now, color = "#742573" } = props;
    const [viewbox, setViewbox] = useState(undefined);
    const [svg, setSvg] = useState(null);

    const { pathDirective, stationPositions, routePatterns } = useMemo(
        () => prerenderLine(branchMap),
        [branchMap]
    );
    const trips = useMemo(() => createBoundedTrips(preboundedTrips), [preboundedTrips]);
    const tripIdsToRoutePattern = useMemo(
        () => createTripIdToRoutePatternMap(trips, Object.values(routePatterns)),
        [trips, routePatterns]
    );

    useLayoutEffect(() => {
        if (svg) {
            const paddingX = 2;
            const paddingY = 2;
            const bbox = svg.getBBox();
            const x = bbox.x - paddingX;
            const width = bbox.width + paddingX * 2;
            const y = bbox.y - paddingY;
            const height = bbox.height + paddingY * 2;
            setViewbox(`${x} ${y} ${width} ${height}`);
        }
    }, [svg]);

    const renderLine = () => {
        return <path d={pathDirective} stroke={color} fill="transparent" strokeWidth={3} />;
    };

    const renderStations = () => {
        return Object.entries(stationPositions).map(([stationId, pos]) => {
            const labelPosition = "right";
            const stationName = stationNames[stationId];

            const label = (
                <text
                    fontSize={7}
                    fill={color}
                    textAnchor={labelPosition === "right" ? "start" : "end"}
                    x={4}
                    y={4}
                    aria-hidden="true"
                    style={{ transform: "rotate(45deg)" }}
                >
                    {stationName}
                </text>
            );

            return (
                <g key={stationId} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle cx={0} cy={0} r={2.5} fill="white" stroke={color} />
                    {label}
                </g>
            );
        });
    };

    const renderTrains = () => {
        const tripsInProgress = trips.filter((t) => t.start <= now && t.end >= now);
        return tripsInProgress.map((trip) => {
            const { stopTimes } = trip;
            const routePattern = tripIdsToRoutePattern[trip.id];
            const nextStopTimeIndex = stopTimes.findIndex((st) => st.time > now);
            const nextStopTime = stopTimes[nextStopTimeIndex];
            const previousStopTime = stopTimes[nextStopTimeIndex - 1];
            if (routePattern && nextStopTime && previousStopTime) {
                const { stationOffsets, pathInterpolator } = routePattern;
                const timeBetweenStations = nextStopTime.time - previousStopTime.time;
                const timeElapsedSinceStation = now - previousStopTime.time;
                const progress = timeElapsedSinceStation / timeBetweenStations;
                const previousOffset = stationOffsets[previousStopTime.stationId];
                const nextOffset = stationOffsets[nextStopTime.stationId];
                const offset = previousOffset + (nextOffset - previousOffset) * progress;
                const pos = pathInterpolator(offset);
                return (
                    <g key={trip.id} transform={`translate(${pos.x}, ${pos.y})`}>
                        <circle cx={0} cy={0} r={4} fill={color} opacity={0.5} />
                    </g>
                );
            }
        });
    };

    return (
        <svg ref={setSvg} viewBox={viewbox} aria-hidden="true" preserveAspectRatio="xMidYMin">
            {renderLine()}
            {renderStations()}
            {typeof now === "number" && renderTrains()}
        </svg>
    );
};

export default RouteVisualizer;
