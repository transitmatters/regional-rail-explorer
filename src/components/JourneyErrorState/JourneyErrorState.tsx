import React from "react";
import { PiTrainRegionalDuotone } from "react-icons/pi";
import { TbClockX } from "react-icons/tb";

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
            <PiTrainRegionalDuotone className="train" />
            <div className="badge">
                <TbClockX />
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
