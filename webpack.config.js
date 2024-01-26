// @ts-check
const path = require('path');
const nodeExternals = require('webpack-node-externals');

/**
 * @type {import('webpack').Configuration}
 */
const slsWebpackConfig = {
  mode: 'production',
  devtool: false,
  entry: {
    index: "./src/index.ts"
  },
  externalsPresets: { node: true },
  // print some output for debugging
  stats: "normal",
  optimization: {
    usedExports: true
  },
  resolve: {
    extensions: ['.ts'],
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules|\.webpack/,
        options: {
          transpileOnly: true,
          experimentalFileCaching: true,
        },
      }
    ],
  }
};

module.exports = slsWebpackConfig;