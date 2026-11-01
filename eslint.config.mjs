import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import storybook from "eslint-plugin-storybook";
import globals from "globals";

export default [
    { ignores: ["src/storydata/routeInfo.ts"] },
    js.configs.recommended,
    ...nextCoreWebVitals,
    ...nextTypescript,
    ...storybook.configs["flat/recommended"],
    prettierRecommended,
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
        settings: { react: { version: "detect" } },
        rules: {
            "react/display-name": 0,
            "react/react-in-jsx-scope": 0,
            "react/no-unescaped-entities": 0,
            "react/prop-types": 0,
            "react/jsx-no-target-blank": 0,
            "@typescript-eslint/explicit-function-return-type": 0,
            "@typescript-eslint/no-empty-function": 0,
            "@typescript-eslint/no-empty-object-type": 0,
            "@typescript-eslint/no-explicit-any": 0,
            "@typescript-eslint/no-inferrable-types": 0,
            "@typescript-eslint/no-non-null-assertion": 0,
            "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^_+$" }],
            "@typescript-eslint/no-use-before-define": 0,
            "@typescript-eslint/explicit-module-boundary-types": 0,
            "no-constant-condition": 0,
            "import/no-default-export": "warn",
            "import/no-anonymous-default-export": "warn",
            "prettier/prettier": "error",
            // React Compiler rules new in eslint-plugin-react-hooks v7; existing code trips them
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/refs": "warn",
            "react-hooks/static-components": "warn",
        },
    },
    {
        files: ["**/*.stories.tsx"],
        rules: {
            "import/no-default-export": "off",
            "import/no-anonymous-default-export": "off",
        },
    },
];
