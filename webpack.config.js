const path = require('path');

const exclude = p => 
  /\/node_modules\//.test(p)
  && !p.includes(path.resolve(__dirname, 'node_modules/debug'))

module.exports = {
  mode: 'none',
  entry: './index.ts',
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        use: 'babel-loader',
        exclude,
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            // options: {
            //   transpileOnly: true
            // }
          }
        ],
        exclude,
      }
    ],
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: [ '.tsx', '.ts', '.js', '.jsx' ],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
};
