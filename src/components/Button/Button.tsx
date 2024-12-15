import React, { ReactNode } from "react";
import { Button as RKButton } from "@ariakit/react/button";
import classNames from "classnames";

import styles from "./Button.module.scss";

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    className?: string;
    large?: boolean;
    outline?: boolean;
    minimal?: boolean;
    icon?: ReactNode;
    rightIcon?: ReactNode;
    disabled?: boolean;
}

const Button = React.forwardRef((props: Props, ref) => {
    const { className, children, large, icon, rightIcon, outline, minimal, ...restProps } = props;
    return (
        <RKButton
            className={classNames(
                styles.button,
                large && styles.large,
                outline && styles.outline,
                minimal && styles.minimal,
                className
            )}
            ref={ref as any}
            {...restProps}
        >
            {icon && <div className={styles.icon}>{icon}</div>}
            {children}
            {rightIcon && <div className={styles.rightIcon}>{rightIcon}</div>}
        </RKButton>
    );
});

export default Button;
