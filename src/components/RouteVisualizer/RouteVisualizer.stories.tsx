import React from "react";

import { routeInfo } from "storydata/routeInfo";
import { HOUR } from "time";

const routeInfoEnhanced = routeInfo[1];

import LiveRouteVisualizer from "./LiveRouteVisualizer";
import RouteVisualizer from "./RouteVisualizer";

export default {
    title: "RouteVisualizer",
    component: RouteVisualizer,
};

export const Default = () => (
    <RouteVisualizer
        now={HOUR * 8}
        trips={routeInfoEnhanced.weekdayTrips}
        branchMap={routeInfoEnhanced.branchMap}
        stationNames={routeInfoEnhanced.stationNames}
    />
);

export const Live = () => <LiveRouteVisualizer routeInfo={routeInfo} />;
