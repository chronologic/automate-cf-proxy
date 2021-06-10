const fs = require('fs')
const { config } = require('dotenv')
const uniq = require('lodash/uniq')

config()

const tpl = fs.readFileSync('./wrangler.template.toml').toString('utf-8')

const envVarsRegex = /\(\$([A-Z0-9_]+)\)/g

const matches = [...tpl.matchAll(envVarsRegex)]

const uniqueMatches = uniq(matches.map((match) => match[1]))

let res = tpl

uniqueMatches.forEach((token) => {
  const envVar = process.env[token]
  console.log(`Replacing ($${token}) with ${envVar}`)

  // res = res.replace(new RegExp(token, 'g'), envVar)
  res = res.replace(new RegExp(`\\(\\$${token}\\)`, 'g'), envVar)
})

fs.writeFileSync('./wrangler.toml', res)

console.log('Wrote wrangler.toml')
