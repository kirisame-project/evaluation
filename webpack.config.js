const path = require('path')

const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
// const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')

module.exports = {
    context: path.resolve(__dirname, 'src'),

    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        port: 3100,
    },

    devtool: 'inline-source-map',

    entry: './loader.tsx',

    mode: 'development',

    module: {
        rules: [
            {
                test: /\.(css)$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                exclude: /node_modules/,
                test: /\.(ts|tsx)$/,
                use: [
                    'babel-loader',
                    'ts-loader',
                ],
            },
        ],
    },

    output: {
        filename: '[name].[contenthash:8].js',
        path: path.resolve(__dirname, 'dist'),
    },

    plugins: [
        new BrowserSyncPlugin({
            host: 'localhost',
            open: false,
            proxy: 'http://localhost:3100/',
        }),
        // new CleanWebpackPlugin({
        //     cleanAfterEveryBuildPatterns: ['!config.json']
        // }),
        new HtmlPlugin({
            template: 'index.html',
        }),
    ],

    resolve: { extensions: ['.js', '.ts', '.tsx'] },
}
