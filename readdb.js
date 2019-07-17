'use strict'

// npm
/// <reference path="@types/levelup" />
const level = require("level")

const db = level('dbdbdoo', { valueEncoding: 'json' })
const stuff = new Map()

const split = (key) => {
  const [, repo] = key.split(':')
  const x = stuff.get(repo) || 0
  stuff.set(repo, x + 1)
}

const done = () => {
  const cnts = Array
    .from(stuff)
    .filter(([, n]) => n > 2)
    .sort(([, na], [, nb]) => {
      if (na > nb) return -1
      if (na < nb) return 1
    })
  console.log(JSON.stringify(cnts, null, '  '))
}

db.createKeyStream({
  gt: 'contributorRepo:',
  lt: 'contributorRepo:\ufff0',
})
  .on('data', split)
  .on('end', done)

/*
db.createReadStream({
    gt: 'userId:',
    lt: 'userId:\ufff0',
  })
  .on('data', console.log)
  .on('end', () => console.log('done!'))
*/