const path = require('path')
const webpack = require('webpack')

module.exports = (mode) => ({
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
      ETHEREUM_RPC_URL: undefined,
      ROPSTEN_RPC_URL: undefined,
      ARBITRUM_RPC_URL: undefined,
      ARBITRUM_RINKEBY_RPC_URL: undefined,
      AUTOMATE_PAYMENT_KEY: undefined,
      AUTOMATE_API_URL: undefined,
      SENTRY_DSN: undefined,
    }),
  ],
})
