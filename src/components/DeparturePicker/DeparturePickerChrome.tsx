import React from "react";
import classNames from "classnames";

import styles from "./DeparturePicker.module.scss";

interface Props {
    indicatorPositionFraction: null | number;
    children: React.ReactNode;
    disabled: boolean;
}

const DeparturePickerChrome: React.FunctionComponent<Props> = (props) => {
    const { indicatorPositionFraction, children, disabled } = props;

    const renderIndicator = () => {
        if (indicatorPositionFraction !== null) {
            return (
                <div
                    className={classNames(styles.indicator)}
                    style={{
                        transform: `translateX(-50%)`,
                        left: `${100 * indicatorPositionFraction}%`,
                    }}
                >
                    <div className={styles.indicatorInner}>
                        <div className={styles.topTriangle} />
                        <div className={styles.needle} />
                        <div className={styles.bottomTriangle} />
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={classNames(styles.departurePicker, disabled && styles.disabled)}>
            <div className={styles.top} />
            <div className={styles.container}>
                {children}
                {renderIndicator()}
            </div>
            <div className={styles.bottom} />
        </div>
    );
};

export default DeparturePickerChrome;
