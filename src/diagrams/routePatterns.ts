import { BranchMap } from "types";

import { line, start, stationRange, wiggle } from "./paths";
import { PathCommand, RoutePatternDescriptor } from "./types";

const getBranchCenterOffset = (branchWidths: number[], index: number) => {
    const midpoint = (branchWidths.length - 1) / 2;
    if (index > midpoint) {
        let previousHalfOffset = branchWidths[midpoint] || 0;
        let offset = 0;
        for (let i = Math.floor(midpoint + 1); i < branchWidths.length; i++) {
            const halfOffset = branchWidths[i] / 2;
            offset += halfOffset + previousHalfOffset;
            previousHalfOffset = halfOffset;
        }
        return offset;
    } else if (index < midpoint) {
        let previousHalfOffset = branchWidths[midpoint] || 0;
        let offset = 0;
        for (let i = Math.ceil(midpoint - 1); i >= 0; i--) {
            const halfOffset = branchWidths[i] / 2;
            offset -= halfOffset + previousHalfOffset;
            previousHalfOffset = halfOffset;
        }
        return offset;
    }
    // if index === midpoint or non-numeric data
    return 0;
};

const createStationRangeSegment = (stationIds: string[], width: number) => {
    return [
        start(0, 0, 0),
        stationRange({ stations: stationIds, commands: [line(width)] }),
    ] as const;
};

interface DescribeRoutePatternsOptions {
    minimumBranchSpacing?: number;
    stationRangePadding?: number;
    stationSpacing?: number;
    branchingLength?: number;
}

const describeRoutePatternsInner = (
    branchMap: BranchMap,
    options: DescribeRoutePatternsOptions
) => {
    const {
        minimumBranchSpacing = 70,
        stationSpacing = 50,
        stationRangePadding = 20,
        branchingLength = 30,
    } = options;
    const { branches, stationIds, routePatternIds } = branchMap;
    const routePatterns: Record<string, RoutePatternDescriptor> = {};

    const straightaway = createStationRangeSegment(stationIds, stationIds.length * stationSpacing);

    if (branches) {
        const subRoutePatternMaps: Record<string, RoutePatternDescriptor>[] = [];
        const widths: number[] = [];

        for (const branch of branchMap.branches!) {
            const { routePatterns: subRoutePatternMap, width } = describeRoutePatternsInner(
                branch,
                options
            );
            subRoutePatternMaps.push(subRoutePatternMap);
            widths.push(Math.max(width, minimumBranchSpacing));
        }

        for (let i = 0; i < widths.length; i++) {
            const subRoutePatternMap = subRoutePatternMaps[i];
            const centerOffset = getBranchCenterOffset(widths, i);
            const adjustment: PathCommand =
                centerOffset === 0 ? line(branchingLength) : wiggle(branchingLength, centerOffset);
            const padding: PathCommand = line(stationRangePadding);
            const pathToCenterOffset = [padding, adjustment, padding];
            for (const [routePatternId, descriptor] of Object.entries(subRoutePatternMap)) {
                const { shape: subshape, stationIds: subStationIds } = descriptor;
                const [_, ...restSubshape] = subshape;
                const fullShape = [
                    ...straightaway,
                    ...pathToCenterOffset,
                    ...restSubshape,
                ] as const;
                routePatterns[routePatternId] = {
                    shape: fullShape,
                    stationIds: [...stationIds, ...subStationIds],
                };
            }
        }

        return {
            routePatterns: routePatterns,
            width: widths.reduce((a, b) => a + b, 0),
        };
    }

    for (const routePatternId of routePatternIds) {
        routePatterns[routePatternId] = {
            shape: straightaway,
            stationIds,
        };
    }

    return { routePatterns: routePatterns, width: 0 };
};

export const describeRoutePatterns = (
    branchMap: BranchMap,
    options: DescribeRoutePatternsOptions = {}
) => {
    return describeRoutePatternsInner(branchMap, options).routePatterns;
};
