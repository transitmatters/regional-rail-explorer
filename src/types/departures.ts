import { NetworkTime } from "./time";
import { JourneyStation } from "./journey";

export interface DepartureBoardEntry {
    time: NetworkTime;
    routeId: string;
    serviceId: string;
    destination: JourneyStation;
}
