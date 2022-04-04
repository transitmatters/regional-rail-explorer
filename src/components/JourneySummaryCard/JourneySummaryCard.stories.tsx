import { baselineInfo, enhancedInfo } from "storydata/journeyInfo";

import JourneySummaryCard from "./JourneySummaryCard";

export default {
    title: "JourneySummaryCard",
    component: JourneySummaryCard,
};

export const Default = () => (
    <JourneySummaryCard day="saturday" baseline={baselineInfo} enhanced={enhancedInfo} />
);
