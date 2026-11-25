const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const sourcePath = path.resolve(__dirname, 'src');

module.exports = (_env, argv = {}) => {
  const isProduction = argv.mode === 'production';
  const filename = extension => isProduction
    ? `[name].[contenthash:8].${extension}`
    : `[name].${extension}`;

  return {
    context: sourcePath,
    entry: { main: './index.js' },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: filename('js'),
      assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
      publicPath: '',
      clean: true,
    },
    resolve: {
      extensions: ['.js', '.json'],
      alias: { '@': sourcePath },
    },
    devtool: isProduction ? false : 'source-map',
    devServer: {
      static: { directory: sourcePath },
      port: 4200,
      hot: true,
      open: true,
      compress: true,
    },
    plugins: [
      new HTMLWebpackPlugin({
        template: './index.html',
        minify: isProduction,
      }),
      new CopyWebpackPlugin({
        patterns: [{
          from: path.join(sourcePath, 'img'),
          to: 'img',
          noErrorOnMissing: true,
        }],
      }),
      new MiniCssExtractPlugin({ filename: filename('css') }),
      new ESLintPlugin({ context: sourcePath, extensions: ['js'] }),
    ],
    optimization: {
      splitChunks: { chunks: 'all' },
      minimizer: [
        new CssMinimizerWebpackPlugin(),
        new TerserWebpackPlugin({ extractComments: false }),
      ],
    },
    module: {
      rules: [
        {
          test: /\.(scss|css)$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.js$/i,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              configFile: path.resolve(__dirname, '.babelrc'),
              babelrc: false,
            },
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
  };
};
