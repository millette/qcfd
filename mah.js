'use strict'

// npm
const level = require("level")

// self
const funds = require('./funds.json').map(({repo}) => repo).sort()

// console.log(funds)

const db = level('dbdbdoo', { valueEncoding: 'json' })

const doit = ({ key, value }) => {
  const rep = key.split(':')[2]

  if (funds.indexOf(rep) !== -1) return
  db.get(value)
    // .then((g) => console.log('GET', g.nameWithOwner))
    .then((g) => {
      // if (!g.defaultBranchRef) return
      const br = g.defaultBranchRef && g.defaultBranchRef.name
      if (!br) return
      // console.log(g.nameWithOwner, br)
      console.log(`https://raw.githubusercontent.com/${g.nameWithOwner}/${br}/.github/FUNDING.yml`)
    })
    .catch(console.error)
  // console.log('SKIP', rep)


  // console.log(d)
  /*
  if (funds.indexOf(d) === -1) return db.get(d)
    .then((g) => console.log('GET', g.nameWithOwner))
    .catch(console.error)
  console.log('SKIP', d.nameWithOwner)
  */
}

const show = (d) => {
  // return console.log(d)
  if ((d.repositories && d.repositories.totalCount > 100) || (d.repositoriesContributedTo && d.repositoriesContributedTo.totalCount > 100)) {
    // return console.log(d)
    // console.log(d.login)
    db.createReadStream({
      gt: `repoContributor:${d.login}:`,
      lt: `repoContributor:${d.login}:\ufff0`,
    })
    .on('data', doit)
    // .on('data', (d2) => console.log(d.login, d2.key, d2.value))
    // .once('end', () => console.error('done!'))
  }
}

db.createValueStream({
  // gt: 'repo:',
  // lt: 'repo:\ufff0',
  gt: 'userId:',
  lt: 'userId:\ufff0',
})
.on('data', show)
.once('end', () => console.error('done!'))
