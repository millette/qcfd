'use strict'

// core
const { readFile } = require('fs')
const { pipeline } = require('stream')

// npm
const glob = require('fast-glob')
const through = require("through2")
const { safeLoad, JSON_SCHEMA, YAMLException } = require('js-yaml')
const stdout = require('stdout')

const fix = (cnt) => {
  const obj = safeLoad(cnt, { schema: JSON_SCHEMA })
  let r
  let n
  for (r in obj) {
    if (obj[r] && Array.isArray(obj[r])) {
      if (obj[r].length === 1) obj[r] = obj[r][0]
      else if (!obj[r].length) obj[r] = false
    }

    if (obj[r]) n = true
    else delete obj[r]
  }
  return n && obj
}

const tr = through.obj((file, enc, cb) => {
  readFile(file, (err, cnt) => {
    const repo = file.split('/').slice(2, 4).join('/')
    if (err) {
      err.repo = repo
      return cb(err)
    }
    try {
      const funding = fix(cnt)
      if (funding) return cb(null, JSON.stringify({ repo, funding }) + ',')
      cb()
    } catch (e) {
      if (e instanceof YAMLException) console.error(`${repo}:\n${e.message}\n${e = null}`)
      else e.repo = repo
      cb(e)
    }
  })
})

pipeline(
  glob.stream("wrk/**/.github/FUNDING.yml", { dot: true }),
  tr,
  stdout(),
  (err) => err && console.error(err)
)
