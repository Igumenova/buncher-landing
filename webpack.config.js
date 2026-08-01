const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin');
const TerzerWebpackPlugin = require('terser-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const AutoPrefixer = require('autoprefixer');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;
console.log(isDev);

const optimization = () => {
    const config = {
        splitChunks: {
            chunks: 'all'
        }
    }

    if (isProd) {
        config.minimizer = [
            new CssMinimizerWebpackPlugin(),
            new TerzerWebpackPlugin({
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
            }),
        ]
    }
    return config;
};

const filename = ext => isDev ? `[name].${ext}` : `[name].[hash].${ext}`;

const plugins = () => {
    return [
        new HTMLWebpackPlugin({
            template: './index.html',
            minify: {
                collapseWhitespace: isProd,
                removeComments: isProd
            }
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/img'),
                    to: path.resolve(__dirname, 'dist/img')
                },
            ]
        }),
        new MiniCssExtractPlugin({
            filename: filename('css')
        }),
        new ESLintPlugin(),
    ]
}

module.exports = {
    context: path.resolve('src'),
    entry: {
        main: './index.js',
    },
    output: {
        filename: filename('js'),
        path: path.resolve('dist'),
        clean: true,
    },
    resolve: {
        extensions: ['.js', '.json', '.png'],
        alias: {
            '@': path.resolve('src')
        }
    },
    optimization: optimization(),
    devServer: {
        static: {
            directory: path.resolve('src')
        },
        compress: true,
        port: 4200,
        hot: isDev,
        open: true,
        // open: {
        //     app: {
        //         name: 'mozilla-firefox',
        //     },
        // },
    },
    devtool: isDev ? 'source-map' : undefined,
    plugins: plugins(),
    module: {
        rules: [
            {
                test: /\.(scss|css)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    // 'style-loader',
                    'css-loader',
                    'postcss-loader',
                    'sass-loader']
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
}