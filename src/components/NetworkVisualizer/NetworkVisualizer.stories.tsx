import React from "react";
import { number, withKnobs } from "@storybook/addon-knobs";

import { DAY, MINUTE } from "time";

import NetworkVisualizer from "./NetworkVisualizer";
import { LiveNetworkVisualizer } from "components";

export default {
    title: "NetworkVisualizer",
    component: NetworkVisualizer,
    decorators: [withKnobs],
};

export const Default = () => (
    <NetworkVisualizer
        curveRadius={number("Curve radius", 10, {
            range: true,
            min: 5,
            max: 50,
            step: 1,
        })}
        elapsed={number("Seconds elapsed", 0, { range: true, min: 0, max: DAY, step: MINUTE })}
    />
);

export const Live = () => <LiveNetworkVisualizer />;
