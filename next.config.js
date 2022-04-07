/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const { stringify, parse } = require("flatted");
const memoize = require("fast-memoize");
const {
    PHASE_PRODUCTION_BUILD,
    PHASE_PRODUCTION_SERVER,
    PHASE_DEVELOPMENT_SERVER,
} = require("next/constants");

const scenariosFilePath = path.join(".", "scenarios.json");

// See https://github.com/vercel/next.js/issues/10142#issuecomment-648974042
const hackStylesToSupportNonPureDeclarations = (config) => {
    const oneOf = config.module.rules.find((rule) => typeof rule.oneOf === "object");

    const fixUse = (use) => {
        const { loader, options } = use;
        if (options && options.modules && loader && loader.indexOf("css-loader") >= 0) {
            options.modules.mode = "local";
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
};

const loadScenariosJsonStringFromFile = () => {
    return fs.readFileSync(scenariosFilePath);
};

const createScenariosJsonString = memoize(() => {
    // eslint-disable-next-line no-global-assign
    require = require("esm")(module);
    require("tsconfig-paths").register({ baseUrl: `${process.cwd()}/src`, paths: {} });
    require("ts-node").register({
        compilerOptions: {
            baseUrl: `${process.cwd()}/src`,
        },
    });
    return stringify(require("./src/server/_loadScenarios").loadScenarios());
});

const createWriteScenariosPlugin = () => {
    const createFile = () => {
        fs.writeFileSync(scenariosFilePath, createScenariosJsonString());
    };

    return {
        apply: (compiler) => {
            compiler.hooks.done.tap("CreateWriteScenariosWebpack", createFile);
        },
    };
};

const getServerRuntimeConfig = (phase) => {
    if (phase === PHASE_PRODUCTION_SERVER) {
        return { scenarios: parse(loadScenariosJsonStringFromFile()) };
    } else if (phase === PHASE_DEVELOPMENT_SERVER) {
        return { scenariosString: createScenariosJsonString() };
    }
    return {};
};

module.exports = (phase) => {
    const shouldWriteScenariosWithWebpack = phase === PHASE_PRODUCTION_BUILD;
    const serverRuntimeConfig = getServerRuntimeConfig(phase);
    return {
        serverRuntimeConfig,
        webpack: (config) => {
            if (shouldWriteScenariosWithWebpack) {
                config.plugins.push(createWriteScenariosPlugin());
            }
            hackStylesToSupportNonPureDeclarations(config);
            return config;
        },
        typescript: {
            ignoreBuildErrors: true,
        },
    };
};
