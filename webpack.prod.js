const path = require('path')
const { config } = require('dotenv')
const createConfig = require('./webpack.base')

config({
  path: path.join(__dirname, '.env.production'),
})

const mode = process.env.NODE_ENV || 'production'

module.exports = createConfig(mode)
