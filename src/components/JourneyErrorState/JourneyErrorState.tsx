import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faTrain } from "@fortawesome/free-solid-svg-icons";

import styles from "./JourneyErrorState.module.scss";

type Props = {
    title?: React.ReactNode;
    message?: React.ReactNode;
    // "noTrain" is for trips the scenarios can't route, rather than a request that failed
    kind?: "error" | "noTrain";
};

const NoTrainIcon = () => {
    return (
        <div className={styles.noTrainIcon} aria-hidden="true">
            <FontAwesomeIcon icon={faTrain} className="train" />
            <div className="badge">
                <FontAwesomeIcon icon={faClock} />
            </div>
        </div>
    );
};

const JourneyErrorState = (props: Props) => {
    const {
        title = "Looks like we got lost.",
        message = "This route failed to load.",
        kind = "error",
    } = props;
    return (
        <div className={styles.journeyErrorState}>
            {kind === "noTrain" && <NoTrainIcon />}
            <h2>{title}</h2>
            <p>{message}</p>
        </div>
    );
};

export default JourneyErrorState;
