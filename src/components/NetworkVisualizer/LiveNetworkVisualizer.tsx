import React, { useState } from "react";

import { useIncrementingTime } from "hooks";

import { Props as NetworkVisualizerProps, NetworkVisualizer } from "./NetworkVisualizer";

type Props = Omit<NetworkVisualizerProps, "elapsed">;

export const LiveNetworkVisualizer: React.FunctionComponent<Props> = (props) => {
    const [elapsed, setElapsed] = useState(0);

    useIncrementingTime({
        timeBounds: [0, Infinity],
        setTime: setElapsed,
        minutesPerSecond: 2,
        ticksPerSecond: 60,
    });

    return <NetworkVisualizer elapsed={elapsed} {...props} />;
};
