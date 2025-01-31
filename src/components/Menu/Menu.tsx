import React from "react";
import classNames from "classnames";
import * as AK from "@ariakit/react/menu";

import { MenuContext } from "./menuContext";
import styles from "./Menu.module.scss";

export type MenuProps = {
    "aria-label"?: string;
    children: React.ReactNode;
    className?: string;
    disclosure: ((disclosureProps: AK.MenuButtonProps) => React.ReactNode) | React.ReactNode;
    menuStyle?: React.CSSProperties;
    placement?: string;
    onDismiss?: () => unknown;
};

const renderDisclosure = (disclosure, disclosureProps) => {
    if (typeof disclosure === "function") {
        return disclosure(disclosureProps);
    }
    return React.cloneElement(disclosure, disclosureProps);
};

export const Menu = React.forwardRef(
    (
        {
            "aria-label": ariaLabel,
            children,
            className,
            disclosure,
            placement,
            onDismiss,
            menuStyle,
            ...restProps
        }: MenuProps,
        ref: any
    ) => {
        const menu = AK.useMenuStore({
            placement: placement as any,
        });

        const handleDismiss = () => {
            menu.hide();
            onDismiss && onDismiss();
        };

        return (
            <React.Fragment>
                <AK.MenuButton
                    ref={ref}
                    store={menu}
                    {...restProps}
                    render={(renderProps) =>
                        renderDisclosure(disclosure, { ...renderProps, "aria-label": ariaLabel })
                    }
                />
                <AK.Menu
                    store={menu}
                    aria-label={ariaLabel}
                    style={{ zIndex: 1, ...menuStyle }}
                    className={classNames(styles.menu, className)}
                    render={<ul />}
                >
                    <MenuContext.Provider value={{ parentMenu: menu, dismissMenu: handleDismiss }}>
                        {children}
                    </MenuContext.Provider>
                </AK.Menu>
            </React.Fragment>
        );
    }
);
