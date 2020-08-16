import React from "react";
import classNames from "classnames";

import styles from "./JourneyComparison.module.scss";

interface RowProps {
    title?: React.ReactNode;
    baseline: React.ReactNode;
    enhanced: React.ReactNode;
    noPadding?: boolean;
    isHeader?: boolean;
}

const ComparisonRow = (props: RowProps) => {
    const { title = "", baseline, enhanced, noPadding, isHeader } = props;
    return (
        <div
            className={classNames(
                styles.comparisonRow,
                noPadding && "no-padding",
                isHeader && "header"
            )}
        >
            <div className="title">{title}</div>
            <div className="baseline">{baseline}</div>
            <div className="enhanced">{enhanced}</div>
        </div>
    );
};

export default ComparisonRow;
