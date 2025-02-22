import React from "react";

import { DAY, MINUTE } from "time";

import { LiveNetworkVisualizer, NetworkVisualizer } from "components";

export default {
    title: "NetworkVisualizer",
    component: NetworkVisualizer,
};

export const Default = ({ curveRadius, elapsed }) => (
    <NetworkVisualizer curveRadius={curveRadius} elapsed={elapsed} />
);

Default.args = {
    curveRadius: 10,
    elapsed: 0,
};

Default.argTypes = {
    curveRadius: {
        control: {
            type: "range",
            min: 5,
            max: 50,
            step: 1,
        },
    },
    elapsed: {
        control: {
            type: "range",
            min: 0,
            max: DAY,
            step: MINUTE,
        },
    },
};

export const Live = () => <LiveNetworkVisualizer />;
