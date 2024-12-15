module.exports = {
    addons: [
        '@storybook/addon-actions/register',
        '@storybook/addon-viewport/register',
        '@storybook/addon-knobs/register',
    ],

    stories: ['../src/components/**/*.stories.@(js|jsx|ts|tsx)'],

    framework: {
        name: '@storybook/nextjs',
        options: {}
    },

    docs: {
        autodocs: true
    },

    typescript: {
        reactDocgen: 'react-docgen-typescript'
    }
};