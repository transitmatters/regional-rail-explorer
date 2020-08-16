import React from "react";

import CrowdingIllustration from "./CrowdingIllustration";

export default {
    title: "CrowdingIllustration",
    component: CrowdingIllustration,
};

export const Low = () => <CrowdingIllustration crowding="low" />;
export const Normal = () => <CrowdingIllustration crowding="normal" />;
export const High = () => <CrowdingIllustration crowding="high" />;
export const Crush = () => <CrowdingIllustration crowding={60} />;
