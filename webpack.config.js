const path = require('path');

const exclude = p => 
  /\/node_modules\//.test(p)
  && !p.includes(path.resolve(__dirname, 'node_modules/debug'))

module.exports = {
  entry: './test/assertionsSpec.ts',
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude,
      },
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude,
      },
    ],
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: [ '.tsx', '.ts', '.js', '.jsx' ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
