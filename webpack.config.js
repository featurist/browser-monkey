const webpack = require('webpack')
const path = require('path');

const exclude = p => 
  /\/node_modules\//.test(p)
  && !p.includes(path.resolve(__dirname, 'node_modules/debug'))

module.exports = {
  mode: 'none',
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
  plugins: [
    // fix "process is not defined" error:
    // (do "npm install process" before running the build)
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  resolve: {
    extensions: [ '.tsx', '.ts', '.js', '.jsx' ],
    fallback: {
      path: false,
      assert: require.resolve('assert/')
    }
  }
};
