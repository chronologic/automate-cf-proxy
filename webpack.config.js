const { config } = require('dotenv')
const createConfig = require('./webpack.base')

config()

const mode = process.env.NODE_ENV || 'production'

module.exports = createConfig(mode)
