import React from "react";

import { easternRouteInfo } from "storydata/routeInfo";
import { HOUR } from "time";

import LiveRouteVisualizer from "./LiveRouteVisualizer";
import RouteVisualizer from "./RouteVisualizer";

export default {
    title: "RouteVisualizer",
    component: RouteVisualizer,
};

export const Default = () => (
    <RouteVisualizer
        now={HOUR * 8}
        trips={easternRouteInfo.weekdayTrips}
        branchMap={easternRouteInfo.branchMap}
        stationNames={easternRouteInfo.stationNames}
    />
);

export const Live = () => (
    <LiveRouteVisualizer
        trips={easternRouteInfo.weekdayTrips}
        branchMap={easternRouteInfo.branchMap}
        stationNames={easternRouteInfo.stationNames}
    />
);
