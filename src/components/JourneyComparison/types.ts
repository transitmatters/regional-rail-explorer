import { JourneyInfo } from "types";

export interface ComparisonProps {
    baseline: JourneyInfo;
    enhanced: JourneyInfo;
    departAfter: boolean;
}
