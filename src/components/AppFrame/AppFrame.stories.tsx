import React from "react";

import AppFrame from "./AppFrame";

export default {
    title: "AppFrame",
    component: AppFrame,
};

export const Default = () => (
    <AppFrame
        mode="journey"
        breadcrumbs={[
            "Oof",
            <a key={0} href="#">
                Ouch
            </a>,
        ]}
    >
        {null}
    </AppFrame>
);
