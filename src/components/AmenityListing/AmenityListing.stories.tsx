import React from "react";

import AmenityListing from "./AmenityListing";

export default {
    title: "AmenityListing",
    component: AmenityListing,
};

export const Default = () => {
    return <AmenityListing present={["electricTrains", "increasedTopSpeed", "levelBoarding"]} />;
};

export const Absence = () => {
    return (
        <AmenityListing
            present={["electricTrains", "increasedTopSpeed"]}
            absent={["levelBoarding"]}
        />
    );
};
