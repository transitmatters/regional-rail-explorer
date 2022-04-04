import React from "react";

import styles from "./JourneyErrorState.module.scss";

const JourneyErrorState = () => {
    return (
        <div className={styles.journeyErrorState}>
            <h2>Looks like we got lost.</h2>
            <p>
                This route failed to load.
            </p>
        </div>
    );
};

export default JourneyErrorState;
