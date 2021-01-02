import {
    PathCommand,
    pathEntryIsStationRange,
    PathSegment,
    PathShape,
    PrerenderedRoute,
    RouteDescriptor,
    StationRange,
    StationWithOffset,
} from "./types";

const createPathBuilder = () => {
    let path = "";
    return {
        add: (nextPath: string) => {
            if (path.length === 0) {
                path = nextPath;
            }
            path = path + " " + nextPath;
        },
        get: () => path,
    };
};

export const createInterpolatorForSegments = (segments: PathSegment[]) => {
    return (partialLength: number) => {
        let accumulatedLength = 0;
        let ptr = 0;
        while (accumulatedLength <= partialLength) {
            accumulatedLength += segments[ptr].length;
            if (accumulatedLength < partialLength) {
                if (ptr < segments.length) {
                    ++ptr;
                } else {
                    throw new Error("Ran out of track while mapping position to segment!");
                }
            } else {
                break;
            }
        }
        const segment = segments[ptr];
        const overshootWithinSegment = accumulatedLength - partialLength;
        return segment.get(1 - overshootWithinSegment / segment.length);
    };
};

const getStationIdsWithinRange = (stationRange: StationRange, stationIds: string[]) => {
    const { start, end, stations } = stationRange;
    if (stations) {
        return stations;
    }
    const startIndex = stationIds.indexOf(start);
    const endIndex = stationIds.indexOf(end);
    if (startIndex === -1 || endIndex === -1) {
        throw new Error(
            `Improper use of {start=${start}, end=${end}} properties for stationRange. ` +
                "These stations do not exist in provided stationIds array -- " +
                "consider using stationRange.stations property instead."
        );
    }
    return stationIds.slice(startIndex, endIndex + 1);
};

const getStationPositions = (stationOffsets, pathInterpolator) => {
    const positions = {};
    Object.entries(stationOffsets).forEach(([stationId, offset]) => {
        positions[stationId] = pathInterpolator(offset);
    });
    return positions;
};

const prerenderRoute = (shape: PathShape, stationIds: string[]) => {
    const [start, ...entries] = shape;
    const pathBuilder = createPathBuilder();
    const segments: PathSegment[] = [];
    const stationOffsets: Record<string, number> = {};

    let totalLength = 0;
    let { turtle } = start;

    const consumeCommand = (command: PathCommand) => {
        const segment = command(turtle);
        const { path, length, turtle: nextTurtle } = segment;
        segments.push(segment);
        totalLength += length;
        turtle = nextTurtle;
        pathBuilder.add(path);
        return segment;
    };

    entries.forEach((entry) => {
        if (pathEntryIsStationRange(entry)) {
            const initialLength = totalLength;
            const segmentsInRange = [];
            const stationIdsWithinRange = getStationIdsWithinRange(entry, stationIds);

            entry.commands.forEach((command) => {
                const segment = consumeCommand(command);
                segmentsInRange.push(segment);
            });

            const segmentsLength = totalLength - initialLength;

            stationIdsWithinRange.forEach((stationId, index) => {
                const fraction =
                    stationIdsWithinRange.length === 1
                        ? 0.5
                        : index / (stationIdsWithinRange.length - 1);
                stationOffsets[stationId] = initialLength + fraction * segmentsLength;
            });
        } else {
            consumeCommand(entry);
        }
    });

    return {
        stationOffsets,
        pathDirective: pathBuilder.get(),
        pathInterpolator: createInterpolatorForSegments(segments),
    };
};

const mergeStationsFromRoutes = (routes: Record<string, PrerenderedRoute>) => {
    const stations: Record<string, StationWithOffset> = {};
    for (const route of Object.values(routes)) {
        for (const station of route.stations) {
            stations[station.id] = station;
        }
    }
    return stations;
};

export const prerenderLine = (routesById: Record<string, RouteDescriptor>) => {
    const pathBuilder = createPathBuilder();
    const routes: Record<string, PrerenderedRoute> = {};
    let stationPositions: Record<string, number> = {};

    for (const [routeId, { shape, stations }] of Object.entries(routesById)) {
        const stationIds = stations.map((s) => s.id);
        const { pathInterpolator, stationOffsets, pathDirective } = prerenderRoute(
            shape,
            stationIds
        );

        const route: PrerenderedRoute = {
            id: routeId,
            pathInterpolator: pathInterpolator,
            stations: stations.map((station) => {
                return {
                    id: station.id,
                    name: station.name,
                    offset: stationOffsets[station.id],
                };
            }),
        };

        stationPositions = {
            ...stationPositions,
            ...getStationPositions(stationOffsets, pathInterpolator),
        };

        routes[routeId] = route;
        pathBuilder.add(pathDirective);
    }

    return {
        routes: routes,
        pathDirective: pathBuilder.get(),
        stationPositions: stationPositions,
        stations: mergeStationsFromRoutes(routes),
    };
};
