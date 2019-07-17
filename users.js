'use strict'

// npm
const level = require("level")

const db = level('dbdbdoo', { valueEncoding: 'json' })

const counts = {
  users: 0,
  repositoriesContributedTo: 0,
  repositoriesContributedTo2: 0,
  repositories: 0,
  repositories2: 0,
}

db.createReadStream({
  gt: 'userId:',
  lt: 'userId:\ufff0',
})
  .on('data', ({ key, value: { repositoriesContributedTo, repositories, login } }) => {
    // console.log()
    ++counts.users
    if (repositoriesContributedTo) {
      ++counts.repositoriesContributedTo
      counts.repositoriesContributedTo2 += repositoriesContributedTo.totalCount
      // console.log('repositoriesContributedTo', login, repositoriesContributedTo)
    }

    if (repositories) {
      if (!counts.repositories) {
        console.log('LOGIN', login)
      }
      ++counts.repositories
      counts.repositories2 += repositories.totalCount
      // console.log('repositories', login, repositories)
    }

  })
  .on('end', () => console.log('done!', counts))
