import React from "react";
import type { Meta } from "@storybook/react";

import { AppFrame } from "components";

const meta: Meta<typeof AppFrame> = {
    title: "AppFrame",
    component: AppFrame,
};

export const Default = () => <AppFrame mode="journey">{null}</AppFrame>;

export default meta;
