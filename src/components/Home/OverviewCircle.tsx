import React from "react";

import styles from "./OverviewCircle.module.scss";

type Props = {
    children: React.ReactNode;
};

const OverviewCircle = (props: Props) => {
    const { children } = props;

    return (
        <div className={styles.outer}>
            <div className={styles.left} />
            <div className={styles.right} />
            <div className={styles.center}>{children}</div>
        </div>
    );
};

export default OverviewCircle;
