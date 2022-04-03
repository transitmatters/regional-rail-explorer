import React from "react";
import { MINUTE, stringifyDuration, stringifyTime } from "time";

import { JourneyInfo, JourneyTravelSegment, NetworkDayKind } from "types";

type Props = {
    enhanced: JourneyInfo;
    baseline: JourneyInfo;
    day: NetworkDayKind;
    travelSegmentThickness?: number;
    width?: number;
    padding?: number;
};

const routeColors = {
    Red: "#da291c",
    Blue: "#003da5",
    Orange: "#ed8b00",
    Green: "#00843d",
    Silver: "#7c878e",
};

const getColorForRouteId = (routeId: string) => {
    if (routeId.startsWith("CR-")) {
        return "#80276c";
    }
    if (routeId.startsWith("Green-")) {
        return routeColors.Green;
    }
    if (routeId.startsWith("7")) {
        return routeColors.Silver;
    }
    return routeColors[routeId];
};

const maybeCapitalizeDay = (day: NetworkDayKind) => {
    if (day === "weekday") {
        return day;
    }
    return day.charAt(0).toUpperCase() + day.slice(1);
};

const computeSegmentTimes = (travelSegments: JourneyTravelSegment[]) => {
    const segmentTimes = travelSegments.map((s) => s.endTime - s.startTime);
    const providedTotalTime = segmentTimes.reduce((a, b) => a + b, 0);
    const normalizedSegments = segmentTimes.map((time) => Math.max(time, providedTotalTime / 6));
    const totalTime = normalizedSegments.reduce((a, b) => a + b, 0);
    const elapsedTimes = normalizedSegments.reduce(
        (elapsed: number[], next: number) => {
            const latest = elapsed[elapsed.length - 1];
            return [...elapsed, latest + next];
        },
        [0]
    );
    return {
        segmentTimes: normalizedSegments,
        totalTime: totalTime,
        elapsedTimes: elapsedTimes,
    };
};

const getJourneyDuration = (journey: JourneyInfo) => {
    const { segments } = journey;
    return segments[segments.length - 1].endTime - segments[0].startTime;
};

const Text = (props) => {
    return <text fontFamily="Helvetica,sans-serif" fill="white" {...props} />;
};

const JourneySummaryCard = (props: Props) => {
    const {
        enhanced,
        baseline,
        day,
        travelSegmentThickness = 20,
        width = 800,
        padding = 50,
    } = props;
    const duration = getJourneyDuration(enhanced);
    const baselineDuration = getJourneyDuration(baseline);
    const speedup = baselineDuration - duration;
    const stationDotRadius = 1.2 * travelSegmentThickness;
    const height = width / 2;
    const travelSegments = enhanced.segments.filter(
        (s): s is JourneyTravelSegment => s.kind === "travel"
    );

    const renderStationDot = (x: number, y: number, color: string) => {
        return (
            <>
                <circle
                    key={`station-outer-${x}`}
                    cx={x}
                    cy={y}
                    r={stationDotRadius}
                    fill={color}
                />
                <circle
                    key={`station-inner-${x}`}
                    cx={x}
                    cy={y}
                    r={stationDotRadius * 0.5}
                    fill="white"
                />
            </>
        );
    };

    const preRenderTravelSegment = (
        y: number,
        fromX: number,
        toX: number,
        includeLeftStation: boolean,
        includeRightStation: boolean,
        color: string
    ) => {
        const topY = y - travelSegmentThickness / 2;
        return {
            line: (
                <rect
                    key={`line-${fromX}`}
                    y={topY}
                    x={fromX}
                    width={toX - fromX}
                    height={travelSegmentThickness}
                    fill={color}
                ></rect>
            ),
            stations: [
                includeLeftStation ? renderStationDot(fromX, y, color) : null,
                includeRightStation ? renderStationDot(toX, y, color) : null,
            ],
        };
    };

    const renderTravelSegments = (y: number) => {
        const totalPadding = padding + stationDotRadius;
        const availableWidth = width - totalPadding * 2;
        const { totalTime, elapsedTimes, segmentTimes } = computeSegmentTimes(travelSegments);
        const lastIndex = travelSegments.length - 1;
        const lines: React.ReactNode[] = [];
        const stations: React.ReactNode[] = [];
        travelSegments.forEach((segment, index) => {
            const { routeId } = segment;
            const segmentTime = segmentTimes[index];
            const elapsed = elapsedTimes[index];
            const progress = elapsed / totalTime;
            const x = totalPadding + progress * availableWidth;
            const width = (availableWidth * segmentTime) / totalTime;
            const shouldSkipLeftStation = travelSegments.length > 1 && index === lastIndex;
            const shouldShowRightStation = index === lastIndex || index === lastIndex - 1;
            const { line: lineHere, stations: stationsHere } = preRenderTravelSegment(
                y,
                x,
                x + width,
                !shouldSkipLeftStation,
                shouldShowRightStation,
                getColorForRouteId(routeId)
            );
            lines.push(lineHere);
            stations.push(...stationsHere);
        });
        return (
            <>
                {lines}
                {stations}
            </>
        );
    };

    const renderCaveatText = (y: number) => {
        return (
            <Text fontSize={25} y={y} x={padding} fontWeight="100" fontStyle="italic">
                With frequent and electrified Regional Rail
            </Text>
        );
    };

    const renderToFromText = (baselineY: number) => {
        const startStationName = travelSegments[0].startStation.name;
        const endStationName = travelSegments[travelSegments.length - 1].endStation.name;
        const textLength = 4 + (startStationName + endStationName).length;
        const fontSize = Math.max(25, 65 - textLength ** 1.003);
        const y = baselineY - 1.15 * fontSize;
        return (
            <Text x={padding} y={y} fontSize={fontSize} dominantBaseline="middle">
                <tspan fontWeight="bold">{startStationName}</tspan>
                &nbsp;
                <tspan>to</tspan>
                &nbsp;
                <tspan fontWeight="bold">{endStationName}</tspan>
            </Text>
        );
    };

    const renderTimeAndDateText = (y: number) => {
        const startTime = enhanced.segments[0].startTime;
        return (
            <Text x={padding} y={y} fontSize={30}>
                {stringifyTime(startTime, { use12Hour: true })} on a {maybeCapitalizeDay(day)}
            </Text>
        );
    };

    const renderTimeText = (y: number) => {
        const includeComparison = speedup >= 5 * MINUTE;
        const baselineX = width - padding;
        const comparisonString = includeComparison ? `${stringifyDuration(speedup)} faster` : "";
        const comparisonOffsetX = includeComparison ? 70 + 10 * comparisonString.length : 0;
        return (
            <>
                <Text
                    key={0}
                    x={baselineX - comparisonOffsetX}
                    y={y}
                    textAnchor="end"
                    fontSize={30}
                >
                    {stringifyDuration(duration)}
                </Text>
                {comparisonString && (
                    <Text
                        key={1}
                        x={baselineX}
                        y={y}
                        textAnchor="end"
                        fontSize={30}
                        textDecoration="underline"
                        fill="#579f6b"
                    >
                        {comparisonString}
                    </Text>
                )}
            </>
        );
    };

    const renderLogo = () => {
        return (
            <svg x={padding} y={height - padding - 35}>
                <g transform="scale(0.45)">
                    <path
                        fill="#742573"
                        d="M94 135H57V0h92q14 0 25 3t16 9a32 32 0 0110 13 51 51 0 013 18 42 42 0 01-3 15 35 35 0 01-6 11 39 39 0 01-10 8 64 64 0 01-11 5l44 53h-43l-40-50H94zm72-92a19 19 0 00-1-7 9 9 0 00-4-4 18 18 0 00-7-3 61 61 0 00-10-1H94v29h50a60 60 0 0010-1 18 18 0 007-2 9 9 0 004-5 19 19 0 001-6z"
                    />
                    <path
                        fill="#e5b24b"
                        d="M66 135H30V0h91q15 0 25 3a44 44 0 0117 9 33 33 0 019 13 51 51 0 013 18 42 42 0 01-2 15 35 35 0 01-7 11 39 39 0 01-9 8 64 64 0 01-12 5l45 53h-43l-41-50H66zm72-92a19 19 0 00-1-7 9 9 0 00-3-4 18 18 0 00-7-3 61 61 0 00-11-1H66v29h50a60 60 0 0011-1 18 18 0 007-2 9 9 0 003-5 19 19 0 001-6z"
                    />
                    <path
                        fill="white"
                        d="M37 135H0V0h92q14 0 25 3t16 9a32 32 0 0110 13 51 51 0 013 18 42 42 0 01-3 15 35 35 0 01-6 11 39 39 0 01-10 8 64 64 0 01-11 5l44 53h-43L76 85H37zm72-92a19 19 0 00-1-7 9 9 0 00-4-4 18 18 0 00-7-3 61 61 0 00-10-1H37v29h50a60 60 0 0010-1 18 18 0 007-2 9 9 0 004-5 19 19 0 001-6z"
                    />
                </g>
            </svg>
        );
    };

    const renderTransitMattersText = () => {
        const x = width - padding;
        const y = height - padding - 10;
        return (
            <>
                <Text key={0} y={y} x={x} fontSize={30} fontWeight="bold" textAnchor="end">
                    TransitMatters
                </Text>
                <Text key={1} y={y + 30} x={x} fontSize={25} textAnchor="end">
                    Regional Rail Explorer
                </Text>
            </>
        );
    };

    return (
        <svg xmlns="http://www.w3.org/2000/svg" version="1.2" width={width} height={height}>
            <rect width="100%" height="100%" fill="#14001c" />
            {renderToFromText(160)}
            {renderTimeAndDateText(172)}
            {renderTimeText(172)}
            {renderCaveatText(210)}
            {renderTravelSegments(260)}
            {renderLogo()}
            {renderTransitMattersText()}
        </svg>
    );
};

export default JourneySummaryCard;
