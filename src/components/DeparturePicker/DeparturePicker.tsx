import React from "react";

import { useAppContext } from "hooks";
import { NetworkTime, NetworkTimeRange } from "types";
import { FrequencyTimeline } from "components";

import DeparturePickerDesktop from "./DeparturePickerDesktop";
import DeparturePickerMobile from "./DeparturePickerMobile";
import { DeparturePickerImplProps } from "./types";

interface Props {
    enhancedArrivals: NetworkTime[];
    baselineArrivals: NetworkTime[];
    includeQuarterHourTicks?: boolean;
    disabled?: boolean;
    time: number | null;
    timeRange: NetworkTimeRange;
    onSelectTime: (time: number) => unknown;
    showArrivals?: boolean;
}

const DeparturePicker: React.FunctionComponent<Props> = (props) => {
    const {
        baselineArrivals,
        enhancedArrivals,
        disabled = false,
        time,
        timeRange,
        onSelectTime,
        showArrivals = true,
        includeQuarterHourTicks = false,
    } = props;

    const { isMobile } = useAppContext();

    const implProps: DeparturePickerImplProps = {
        timeRange,
        time,
        onSelectTime,
        disabled,
        timeline: (
            <FrequencyTimeline
                baselineArrivals={baselineArrivals}
                enhancedArrivals={enhancedArrivals}
                timeRange={timeRange}
                showArrivals={showArrivals}
                includeQuarterHourTicks={includeQuarterHourTicks}
            />
        ),
    };

    if (isMobile) {
        return <DeparturePickerMobile {...implProps} time={time || 0} />;
    }
    return <DeparturePickerDesktop {...implProps} />;
};

export default DeparturePicker;
