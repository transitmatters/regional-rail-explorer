import React from "react";

import { SerializableRouteInfo } from "types";
import { LiveRouteVisualizer } from "components";

import styles from "./RoutePage.module.scss";

interface Props {
    scenarios: string[];
    routeInfo: SerializableRouteInfo[];
}

const RoutePage: React.FunctionComponent<Props> = (props) => {
    const { routeInfo } = props;
    const [enhanced] = routeInfo;
    return (
        <div className={styles.routePage}>
            <h1>{enhanced.name} </h1>
            <LiveRouteVisualizer routeInfo={routeInfo} />
        </div>
    );
};

export default RoutePage;
