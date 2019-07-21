'use strict'

// npm
const level = require("level")

// self
const funds = require('./funds.json').map(({repo}) => repo).sort()

const db = level('dbdbdoo', { valueEncoding: 'json' })

const onData = ({ key, value }) => {
  const [, repo, user] = key.split(':')
  // console.log(funds[0], key, repo, user)
  // throw(new Error('CIAO'))
  if (funds.indexOf(repo) === -1) return
  // console.log('checking...')
  // throw(new Error('CIAO'))
  db.get(value)
    .then((x) => {
      console.log(user)
      // console.log(x)
      // console.log()
    })
}

db.createReadStream({
  gt: 'contributorRepo:',
  lt: 'contributorRepo:\ufff0',
  // gt: 'repo:',
  // lt: 'repo:\ufff0',
  // gt: 'userId:',
  // lt: 'userId:\ufff0',
})
.on('data', onData)
.once('end', () => console.error('done!'))

/*
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
  .once('end', done)
*/

/*
const show = ({ defaultBranchRef, nameWithOwner }) => {
  if (!defaultBranchRef) return
  const { name} = defaultBranchRef

  https://raw.githubusercontent.com/ubik23/charactercreator/master/src2/
  console.log(`https://raw.githubusercontent.com/${nameWithOwner}/${name}/.github/FUNDING.yml`)
  // console.log(nameWithOwner, name)
}

db.createValueStream({
    gt: 'repo:',
    lt: 'repo:\ufff0',
    // gt: 'userId:',
    // lt: 'userId:\ufff0',
  })
  .on('data', show)
  .once('end', () => console.log('done!'))
*/
