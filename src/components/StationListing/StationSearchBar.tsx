import React from "react";
import classNames from "classnames";

import styles from "./StationSearchBar.module.scss";

type Props = {
    value: string;
    onChange: (value: string) => unknown;
    smaller?: boolean;
};

const StationSearchBar = React.forwardRef((props: Props, ref: any) => {
    const { onChange, value, smaller } = props;
    return (
        <input
            type="text"
            ref={ref}
            value={value}
            className={classNames(styles.search, smaller && styles.smaller)}
            placeholder="Search for a station..."
            onChange={(evt) => onChange(evt.target.value)}
        />
    );
});

export default StationSearchBar;
