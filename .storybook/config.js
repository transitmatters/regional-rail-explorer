import { configure, addParameters } from '@storybook/react';

configure(require.context('../src/components', true, /\.stories\.tsx?$/), module);

addParameters({
    options: {
      enableShortcuts: false,
    },
  })