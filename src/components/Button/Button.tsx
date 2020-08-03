import React, { ReactNode } from "react";
import classNames from "classnames";

import styles from "./Button.module.scss";

interface Props
    extends React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
    > {
    children: ReactNode;
    className?: string;
    large?: boolean;
    rightIcon?: ReactNode;
}

const Button = React.forwardRef((props: Props, ref) => {
    const { className, children, large, rightIcon, ...restProps } = props;
    return (
        <button
            className={classNames(styles.button, large && styles.large, className)}
            ref={ref as any}
            {...restProps}
        >
            {children}
            {rightIcon && <div className={styles.rightIcon}>{rightIcon}</div>}
        </button>
    );
});

export default Button;
