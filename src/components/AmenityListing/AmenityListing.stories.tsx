import React from "react";

import AmenityListing from "./AmenityListing";

export default {
    title: "AmenityListing",
    component: AmenityListing,
};

export const Default = () => {
    return (
        <AmenityListing present={["electric-trains", "increased-top-speed", "level-boarding"]} />
    );
};

export const Absence = () => {
    return (
        <AmenityListing
            present={["electric-trains", "increased-top-speed"]}
            absent={["level-boarding"]}
        />
    );
};
