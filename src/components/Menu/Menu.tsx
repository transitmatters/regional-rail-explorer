import React from "react";
import classNames from "classnames";
import * as RK from "reakit/Menu";

import { MenuContext } from "./menuContext";
import styles from "./Menu.module.scss";

export type MenuProps = {
    "aria-label"?: string;
    children: React.ReactNode;
    className?: string;
    disclosure: ((disclosureProps: RK.MenuDisclosureProps) => React.ReactNode) | React.ReactNode;
    gutter?: number;
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

export const Menu = React.forwardRef((props: MenuProps, ref: any) => {
    const {
        "aria-label": ariaLabel,
        children,
        className,
        disclosure,
        placement,
        gutter,
        onDismiss,
        menuStyle,
        ...restProps
    } = props;

    const menu = RK.useMenuState({
        placement: placement as any,
        gutter: gutter,
        unstable_preventOverflow: false,
        unstable_flip: false,
    });

    const handleDismiss = () => {
        menu.hide();
        onDismiss && onDismiss();
    };

    return (
        <React.Fragment>
            <RK.MenuDisclosure ref={ref} {...menu} {...restProps}>
                {(disclosureProps) =>
                    renderDisclosure(disclosure, { ...disclosureProps, "aria-label": ariaLabel })
                }
            </RK.MenuDisclosure>
            <RK.Menu
                aria-label={ariaLabel}
                as="ul"
                style={{ zIndex: 1, ...menuStyle }}
                className={classNames(styles.menu, className)}
                {...menu}
            >
                <MenuContext.Provider value={{ parentMenu: menu, dismissMenu: handleDismiss }}>
                    {children}
                </MenuContext.Provider>
            </RK.Menu>
        </React.Fragment>
    );
});
