import { JourneyInfo, JourneyApiResult } from "types";

export const successfulJourneyApiResult = (result: JourneyApiResult): null | JourneyInfo[] => {
    if (result.some((entry) => "error" in entry)) {
        return null;
    }
    return result as JourneyInfo[];
};
