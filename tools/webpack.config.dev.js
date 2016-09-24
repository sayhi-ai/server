var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: './src/router.js',
  devtool: 'sourcemap',
  target: 'node',
  output: {
    path: "./dev",
    filename: "server.min.js"
  },
  module: {
    loaders: [
      {test: /\.json$/, loader: "json-loader"},
      {test: /\.jsx?$/, exclude: /(node_modules)/, loader: 'babel-loader'}
    ]
  },
  externals: nodeModules,
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/),
    new webpack.BannerPlugin('require("source-map-support").install();',
      {raw: true, entryOnly: false}),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"development"'
    }),
    new CopyWebpackPlugin([
      {from: 'assets'}
    ])
  ]
};
