module.exports = {
    addons: [
        '@storybook/addon-actions',
        '@storybook/addon-viewport',
        '@storybook/addon-controls',
    ],

    stories: ['../src/components/**/*.stories.@(js|jsx|ts|tsx)'],

    framework: {
        name: '@storybook/nextjs',
        options: {}
    },

    docs: {
        autodocs: false
    },

    typescript: {
        reactDocgen: 'react-docgen-typescript'
    }
};