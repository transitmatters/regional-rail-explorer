import React from "react";

import CrowdingIllustration from "./CrowdingIllustration";

export default {
    title: "CrowdingIllustration",
    component: CrowdingIllustration,
};

export const Low = () => <CrowdingIllustration crowding={15} />;
export const Normal = () => <CrowdingIllustration crowding={30} />;
export const High = () => <CrowdingIllustration crowding={45} />;
export const Crush = () => <CrowdingIllustration crowding={60} />;
