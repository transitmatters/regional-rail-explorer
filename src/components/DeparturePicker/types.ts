import React from "react";

import { NetworkTime, NetworkTimeRange } from "types";

export type DeparturePickerImplProps = {
    disabled?: boolean;
    time: null | number;
    timeRange: NetworkTimeRange;
    onSelectTime: (time: NetworkTime) => unknown;
    timeline: React.ReactNode;
};
