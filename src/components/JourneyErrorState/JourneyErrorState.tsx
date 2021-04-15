import React from "react";

import { ScenarioInfo } from "types";

import styles from "./JourneyErrorState.module.scss";

type Props = {
    scenarioWithError: ScenarioInfo;
};

const JourneyErrorState = (props: Props) => {
    const { scenarioWithError } = props;
    return (
        <div className={styles.journeyErrorState}>
            <h2>Looks like we got lost.</h2>
            <p>
                The scenario <i>{scenarioWithError.name}</i> failed to load.
            </p>
        </div>
    );
};

export default JourneyErrorState;
