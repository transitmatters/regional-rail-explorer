import { Button } from "components";

import React, { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import { Menu, MenuProps } from "./Menu";
import { MenuItem } from "./MenuItem";

interface SelectItem {
    label: string;
    id: string;
    href?: string;
}

interface Props<I> extends Omit<MenuProps, "disclosure" | "children"> {
    disclosure?: (i: I) => React.ReactElement;
    disclosureProps?: Record<string, any>;
    items: I[];
    selectedItem: I;
    onSelect: (i: I) => unknown;
}

const defaultDisclosure = (item: SelectItem) => (
    <Button rightIcon={<FontAwesomeIcon icon={faChevronDown} />}>{item.label}</Button>
);

const Select = <I extends SelectItem>(props: Props<I>) => {
    const {
        items,
        selectedItem,
        onSelect,
        disclosureProps,
        disclosure = defaultDisclosure,
        ...menuProps
    } = props;
    const [disclosureWidth, setDisclosureWidth] = useState(200);

    const measureDisclosureWidth = useCallback(
        (el) => el && setDisclosureWidth(el.getBoundingClientRect().width),
        []
    );

    return (
        <Menu
            {...menuProps}
            ref={measureDisclosureWidth}
            menuStyle={{ minWidth: disclosureWidth }}
            disclosure={React.cloneElement(disclosure(selectedItem), disclosureProps)}
        >
            {items.map((item) => (
                <MenuItem
                    onClick={() => onSelect(item)}
                    key={item.id}
                    text={item.label}
                    href={item.href}
                />
            ))}
        </Menu>
    );
};

export default Select;
