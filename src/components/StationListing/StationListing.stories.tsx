import React from "react";

import { stationsByLine } from "stations";

import StationListing from "./StationListing";

export default {
    title: "StationListing",
    component: StationListing,
};

export const Default = () => <StationListing stationsByLine={stationsByLine} />;

export const WithoutSearch = () => (
    <StationListing stationsByLine={stationsByLine} showSearch={false} />
);
