import React, { useState } from "react";

import { useIncrementingTime } from "hooks";

import NetworkVisualizer, { Props as NetworkVisualizerProps } from "./NetworkVisualizer";

type Props = Omit<NetworkVisualizerProps, "elapsed">;

const LiveNetworkVisualizer = (props: Props) => {
    const [elapsed, setElapsed] = useState(0);

    useIncrementingTime({
        timeBounds: [0, Infinity],
        setTime: setElapsed,
        minutesPerSecond: 2,
        ticksPerSecond: 60,
    });

    return <NetworkVisualizer elapsed={elapsed} {...props} />;
};

export default LiveNetworkVisualizer;
