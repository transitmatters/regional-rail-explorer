import classNames from "classnames";
import React, { useContext } from "react";
import * as RK from "reakit/Menu";
import { GrNext } from "react-icons/gr";

import { Menu } from "./Menu";
import { MenuContext } from "./menuContext";
import styles from "./Menu.module.scss";

type SharedMenuItemProps = {
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    href?: string;
    icon?: string | React.ReactNode;
    onClick?: (event: MouseEvent) => unknown;
    rightElement?: React.ReactNode;
    target?: string;
    textClassName?: string;
};

type DisplayMenuItemProps = {
    onDismiss: () => unknown;
    hasSubmenu: boolean;
} & SharedMenuItemProps;

const DisplayMenuItem = React.forwardRef((props: DisplayMenuItemProps, ref: any) => {
    const {
        children = null,
        className = "",
        disabled = false,
        hasSubmenu = false,
        href,
        icon = null,
        onClick = null,
        onDismiss = null,
        rightElement = null,
        target = "_self",
        textClassName = "",
        ...restProps
    } = props;

    const label = hasSubmenu ? <GrNext size={14} style={{ paddingLeft: 4 }} /> : rightElement;

    const onClickWithHref = (evt) => {
        if (onClick) {
            onClick(evt);
        }
        if (onDismiss) {
            onDismiss();
        }
        if (href) {
            window.open(href, target);
        }
    };

    return (
        <li
            {...restProps}
            ref={ref}
            className={classNames(styles.menuItem, disabled && styles.menuItemDisabled, className)}
            onClick={onClickWithHref}
        >
            {icon}
            <div className={classNames(styles.menuItemText, textClassName)}>{children}</div>
            {label}
        </li>
    );
});

type MenuItemProps = {
    onClick?: (event: MouseEvent) => unknown;
    text?: React.ReactNode;
    children?: React.ReactNode;
    dismissOnClick?: boolean;
    placement?: string;
    labelElement?: React.ReactNode;
} & SharedMenuItemProps;

export const MenuItem = React.forwardRef((props: MenuItemProps, ref) => {
    const { children = null, text, dismissOnClick = true, ...restProps } = props;
    const { dismissMenu, parentMenu } = useContext(MenuContext);
    if (children) {
        return (
            <Menu
                onDismiss={dismissMenu}
                disclosure={(dProps) => (
                    <RK.MenuItem
                        as={DisplayMenuItem}
                        {...dProps}
                        {...parentMenu}
                        {...restProps}
                        hasSubmenu={true}
                    >
                        {text}
                    </RK.MenuItem>
                )}
            >
                {children}
            </Menu>
        );
    }
    return (
        <RK.MenuItem
            as={DisplayMenuItem}
            ref={ref}
            {...parentMenu}
            {...restProps}
            onDismiss={dismissOnClick ? dismissMenu : null}
        >
            {text}
        </RK.MenuItem>
    );
});

export const MenuItemDivider = () => {
    return (
        <RK.MenuSeparator>
            {(props) => <li className={styles.menuDivider} {...props} />}
        </RK.MenuSeparator>
    );
};
