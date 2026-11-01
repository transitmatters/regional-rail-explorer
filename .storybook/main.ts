import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
    stories: ["../src/components/**/*.stories.@(js|jsx|ts|tsx)"],

    framework: {
        name: "@storybook/nextjs",
        options: {},
    },

    typescript: {
        reactDocgen: "react-docgen-typescript",
    },
};

export default config;
