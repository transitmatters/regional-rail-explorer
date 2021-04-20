import React from "react";

import styles from "./StationListing.module.scss";

type Props = {
    value: string;
    onChange: (value: string) => unknown;
};

const StationSearchBar = React.forwardRef((props: Props, ref: any) => {
    const { onChange, value } = props;
    return (
        <input
            type="text"
            ref={ref}
            value={value}
            className={styles.search}
            placeholder="Search for a station..."
            onChange={(evt) => onChange(evt.target.value)}
        />
    );
});

export default StationSearchBar;
