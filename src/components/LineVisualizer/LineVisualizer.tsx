import { SerializableRouteInfo, BranchingStationId } from "types";

import { RouteDescriptor } from "./types";

interface Props {
    routeInfo: SerializableRouteInfo;
}

// This doesn't handle multiple branch points, which is okay possibly forever.
export const createPathShapeForLineStations = (branchingStationIds: BranchingStationId[]) => {
    const firstArrayIndex = branchingStationIds.findIndex((x) => Array.isArray(x));
    const branches
};

const LineVisualizer = (props) => {
    return null;
};
