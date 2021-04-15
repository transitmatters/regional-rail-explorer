import React from "react";

import { Button } from "components";

import { Menu, MenuItem } from "./index";

export default {
    title: "Menu",
    component: Menu,
};

export const Default = () => {
    return (
        <Menu disclosure={<Button>Click me!</Button>}>
            <MenuItem text="Item one" />
            <MenuItem text="Item two" />
            <MenuItem text="Item three">
                <MenuItem text="Subitem one" />
                <MenuItem text="Subitem two" />
            </MenuItem>
            <MenuItem text="Item four" />
        </Menu>
    );
};
