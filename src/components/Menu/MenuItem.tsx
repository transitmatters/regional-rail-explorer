import classNames from "classnames";
import React, { MouseEventHandler, useContext } from "react";
import * as AK from "@ariakit/react/menu";
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
    onClick?: (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => unknown;
    rightElement?: React.ReactNode;
    target?: string;
    textClassName?: string;
};

type DisplayMenuItemProps = {
    onDismiss: () => unknown;
    hasSubmenu: boolean;
} & SharedMenuItemProps;

const DisplayMenuItem: React.FunctionComponent = (
    {
        children,
        className = "",
        disabled = false,
        hasSubmenu = false,
        href,
        icon,
        onClick,
        onDismiss,
        rightElement,
        target = "_self",
        textClassName = "",
        ...restProps
    }: DisplayMenuItemProps,
    ref
) => {
    const label = hasSubmenu ? <GrNext size={14} style={{ paddingLeft: 4 }} /> : rightElement;

    const onClickWithHref: React.MouseEventHandler<HTMLLIElement> = (evt) => {
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
};

type MenuItemProps = {
    onClick?: MouseEventHandler<HTMLDivElement>;
    text?: React.ReactNode;
    children?: React.ReactNode;
    dismissOnClick?: boolean;
    placement?: string;
    labelElement?: React.ReactNode;
} & SharedMenuItemProps;

export const MenuItem = React.forwardRef(
    ({ children = null, text, dismissOnClick = true, ...restProps }: MenuItemProps, ref) => {
        const { dismissMenu, parentMenu } = useContext(MenuContext);

        if (children) {
            return (
                <Menu
                    onDismiss={dismissMenu}
                    disclosure={({ ref, ...dProps }) => (
                        // @ts-expect-error ariakit types failing
                        <AK.MenuItem
                            store={parentMenu}
                            {...dProps}
                            {...restProps}
                            ref={ref as any}
                            render={DisplayMenuItem}
                        >
                            {text}
                        </AK.MenuItem>
                    )}
                >
                    {children}
                </Menu>
            );
        }

        return (
            <AK.MenuItem
                render={DisplayMenuItem}
                store={parentMenu}
                ref={ref as any}
                // @ts-expect-error ariakit types failing
                onDismiss={dismissOnClick ? dismissMenu : null}
                {...restProps}
            >
                {text}
            </AK.MenuItem>
        );
    }
);

export const MenuItemDivider = () => {
    const Divider: React.FunctionComponent = (props) => (
        <li className={styles.menuDivider} {...props} />
    );
    return (
        <AK.MenuSeparator>
            <Divider />
        </AK.MenuSeparator>
    );
};
