import React from "react";
import classNames from "classnames";

import styles from "./OverviewCircle.module.scss";

type Props = {
    children: React.ReactNode;
    className?: string;
};

const OverviewCircle = (props: Props) => {
    const { children, className } = props;

    return (
        <div className={classNames(styles.outer, className)}>
            <div className={styles.left} />
            <div className={styles.right} />
            <div className={styles.center}>{children}</div>
        </div>
    );
};

export default OverviewCircle;
