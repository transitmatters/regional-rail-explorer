import React from "react";
import classNames from "classnames";

import styles from "./JourneyComparison.module.scss";

interface RowProps {
    title?: React.ReactNode;
    baseline: React.ReactNode;
    enhanced: React.ReactNode;
    isHeader?: boolean;
}

const ComparisonRow = (props: RowProps) => {
    const { title = "", baseline, enhanced, isHeader } = props;
    return (
        <div className={classNames(styles.comparisonRow, isHeader && "header")}>
            {title && <div className="title">{title}</div>}
            <div className="baseline">{baseline}</div>
            <div className="enhanced">{enhanced}</div>
        </div>
    );
};

export default ComparisonRow;
