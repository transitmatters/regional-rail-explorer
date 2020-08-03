import React from "react";
import { action } from "@storybook/addon-actions";

import Button from "./Button";

export default {
    title: "Button",
    component: Button,
};

export const Default = () => {
    return <Button onClick={action("click")}>Click me!</Button>;
};

export const Large = () => {
    return (
        <Button onClick={action("click")} large>
            Click me, I'm even larger!
        </Button>
    );
};
