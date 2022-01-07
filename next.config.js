/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const { stringify, parse } = require("flatted");
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
};

const loadScenariosStringFromFile = () => {
    return fs.readFileSync(scenariosFilePath);
};

const loadScenarios = () => {
    // eslint-disable-next-line no-global-assign
    require = require("esm")(module);
    require("tsconfig-paths").register({ baseUrl: `${process.cwd()}/src`, paths: {} });
    require("ts-node").register({
        compilerOptions: {
            baseUrl: `${process.cwd()}/src`,
        },
    });
    return require("./src/server/_loadScenarios").loadScenarios();
};

const createWriteScenariosPlugin = () => {
    const createFile = () => {
        fs.writeFileSync(scenariosFilePath, stringify(loadScenarios()));
    };

    return {
        apply: (compiler) => {
            if (compiler.hooks) {
                compiler.hooks.done.tap("CreateWriteScenariosWebpack", createFile);
            } else {
                compiler.plugin("done", createFile);
            }
        },
    };
};

const getServerRuntimeConfig = (phase) => {
    if (phase === PHASE_PRODUCTION_SERVER) {
        return { scenarios: parse(loadScenariosStringFromFile()) };
    } else if (phase === PHASE_DEVELOPMENT_SERVER) {
        return { scenarios: loadScenarios() };
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
