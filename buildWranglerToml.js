const fs = require('fs')
const { config } = require('dotenv')
const uniq = require('lodash/uniq')

const pkg = require('./package.json')

const isDev = process.env.NODE_ENV === 'development'
const path = isDev ? '.env' : '.env.production'

const { parsed } = config({ path })

parsed.RELEASE_VERSION = pkg.version

const tpl = fs.readFileSync('./wrangler.template.toml').toString('utf-8')

const envVarsRegex = /\(\$([A-Z0-9_]+)\)/g
const matches = [...tpl.matchAll(envVarsRegex)]
const uniqueMatches = uniq(matches.map((match) => match[1]))

let res = tpl

uniqueMatches.forEach((token) => {
  const envVar = process.env[token]
  console.log(`Replacing ($${token}) with ${envVar}`)
  delete parsed[token]

  res = res.replace(new RegExp(`\\(\\$${token}\\)`, 'g'), envVar)
})

const otherVarsToml = Object.keys(parsed)
  .map((key) => {
    console.log(`Adding ${key}`)
    return `${key} = "${parsed[key]}"`
  })
  .join('\n')

res = res.replace(new RegExp('\\[vars\\]', 'g'), `[vars]\n${otherVarsToml}`)

fs.writeFileSync('./wrangler.toml', res)

console.log('Wrote wrangler.toml')
