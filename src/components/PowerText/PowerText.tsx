import React from "react";

import styles from "./PowerText.module.scss";

type Props = {
    children: string;
    cool?: boolean;
};

const PowerText = (props: Props) => {
    const { children, cool = false } = props;
    return (
        <div className={styles.outer}>
            {cool && (
                <>
                    <div className={styles.bottom} aria-hidden="true">
                        {children}
                    </div>
                    <div className={styles.middle} aria-hidden="true">
                        {children}
                    </div>
                </>
            )}
            <h1 className={styles.top}>{children}</h1>
        </div>
    );
};

export default PowerText;
