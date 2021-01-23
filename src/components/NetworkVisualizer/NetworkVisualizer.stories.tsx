import React from "react";
import { number, withKnobs } from "@storybook/addon-knobs";

import NetworkVisualizer from "./NetworkVisualizer";

export default {
    title: "NetworkVisualizer",
    component: NetworkVisualizer,
    decorators: [withKnobs],
};

export const Default = () => (
    <NetworkVisualizer
        curveRadius={number("Curve radius", 50, {
            range: true,
            min: 5,
            max: 50,
            step: 1,
        })}
    />
);
