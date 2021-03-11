const path = require('path')
const webpack = require('webpack')
const { config } = require('dotenv')

config()

const mode = process.env.NODE_ENV || 'production'

module.exports = {
  target: 'webworker',
  output: {
    filename: `worker.${mode}.js`,
    path: path.join(__dirname, 'dist'),
  },
  mode,
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      INFURA_API_KEY: undefined,
      INFURA_NETWORK: undefined,
      AUTOMATE_PAYMENT_KEY: undefined,
    }),
  ],
}
