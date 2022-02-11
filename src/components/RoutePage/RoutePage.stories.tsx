import React from "react";

import { routeInfo } from "storydata/routeInfo";

import RoutePage from "./RoutePage";

export default {
    title: "RoutePage",
    component: RoutePage,
};

export const Default = () => (
    <RoutePage scenarios={["present", "regional_rail"]} routeInfo={routeInfo} />
);
