import { NetworkTime } from "./time";

export type ArrivalsInfo = {
    showArrivals: boolean;
    baselineArrivals: NetworkTime[];
    enhancedArrivals: NetworkTime[];
};
