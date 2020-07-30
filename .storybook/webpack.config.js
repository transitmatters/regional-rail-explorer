const path = require("path");

module.exports = ({ config }) => {
    config.resolve = {
        ...config.resolve,
        modules: [
            path.resolve(__dirname, "..", "src"),
            path.resolve(__dirname, "..", "node_modules")
        ],
    };

    config.module.rules.push({
        test: /\.(ts|tsx)$/,
        loader: require.resolve('babel-loader'),
        options: {
            presets: [require.resolve('babel-preset-react-app')],
        },
    });

    config.module.rules.push({
        test: /\.scss$/,
        loaders: [
            require.resolve('style-loader'),
            {
                loader: require.resolve('css-loader'),
                options: {
                    importLoaders: 1,
                    modules: true,
                },
            },
            require.resolve('sass-loader')
        ],
    });

    config.resolve.extensions.push('.ts', '.tsx');
    return config;
};