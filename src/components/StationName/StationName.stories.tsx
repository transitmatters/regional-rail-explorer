import React from "react";

import { stationsByName } from "stations";

import StationName from "./StationName";

export default {
    title: "StationName",
    component: StationName,
};

const WrappedStationName = (props: React.ComponentProps<typeof StationName>) => {
    return (
        <div style={{ padding: "10px" }}>
            <StationName {...props} />
        </div>
    );
};

export const Default = () => {
    return <WrappedStationName station={stationsByName.Salem} />;
};

export const AsLink = () => {
    return <WrappedStationName station={stationsByName.Salem} asLink />;
};

export const InfillStation = () => {
    return (
        <WrappedStationName
            station={stationsByName["Newton Corner"]}
            onRouteId="CR-Framingham"
            asLink
        />
    );
};
