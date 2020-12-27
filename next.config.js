/* eslint-disable @typescript-eslint/no-var-requires */
const { stringify } = require("flatted");

// See https://github.com/vercel/next.js/issues/10142#issuecomment-648974042
const hackStylesToSupportNonPureDeclarations = (config) => {
    const oneOf = config.module.rules.find((rule) => typeof rule.oneOf === "object");

    const fixUse = (use) => {
        if (use.loader.indexOf("css-loader") >= 0 && use.options.modules) {
            use.options.modules.mode = "local";
        }
    };

    if (oneOf) {
        oneOf.oneOf.forEach((rule) => {
            if (Array.isArray(rule.use)) {
                rule.use.map(fixUse);
            } else if (rule.use && rule.use.loader) {
                fixUse(rule.use);
            }
        });
    }

    return config;
};

// eslint-disable-next-line no-global-assign
require = require("esm")(module);

require("tsconfig-paths").register({ baseUrl: `${process.cwd()}/src`, paths: {} });

require("ts-node").register({
    compilerOptions: {
        baseUrl: `${process.cwd()}/src`,
    },
});

module.exports = {
    serverRuntimeConfig: {
        scenarios: stringify(require("./src/server/_loadScenarios").default),
    },
    webpack: (config) => {
        return hackStylesToSupportNonPureDeclarations(config);
    },
};
