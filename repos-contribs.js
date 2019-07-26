'use strict'

// core
const { readFileSync } = require('fs')
const { pipeline } = require('stream')

// npm
const got = require("got")
const level = require("level")
const through = require("through2")

const db = level('dbdbdoo', { valueEncoding: 'json' })

const query = readFileSync('repos-contribs.graphql', 'utf8')

const perPage = 100
const variables = { perPage }
const body = { query, variables }

const gotOpts = {
  retry: { methods: ['POST'] },
  json: true,
  headers: { authorization: `bearer ${process.env.GITHUB_TOKEN}` }
}

// const beenThere = (login) => ({ login }) || new Promise((resolve, reject) => {
const beenThere = (login) => new Promise((resolve, reject) => {
  return resolve({ login })
  let todo = true
  db.createKeyStream({
    gt: `repoContributor:${login}:`,
    lt: `repoContributor:${login}:\ufff0`,
    limit: 1
  })
  .once('data', () => {
    console.error('Already did', login)
    todo = false
  })
  .once('error', reject)
  .once('end', () => resolve(todo && { login }))
})


const yup = ({ body, headers }) => {
  if (!body) throw new Error('No body')

  if (!body.data) {
    console.error(body)
    console.error(headers)
    throw new Error('No data')
  }
  const { data: { user: { login, repositoriesContributedTo: { nodes } } } } = body

  const batch = []
  nodes.forEach((repo) => {
    const key = `repo:${repo.id}`
    batch.push({
      type: 'put',
      key: key,
      value: repo
    })

    batch.push({
      type: 'put',
      key: `repoContributor:${login}:${repo.nameWithOwner}`,
      value: key
    })

    batch.push({
      type: 'put',
      key: `contributorRepo:${repo.nameWithOwner}:${login}`,
      value: key
    })
  })

  return db.batch(batch)
}

const getBatch = async (o) => {
  // let after
  do {
    const b = await getBatchPage(o)
    await yup(b)
    const { data: { user: { repositoriesContributedTo: { pageInfo: { hasNextPage, endCursor } } } } } = b.body
    o.after = hasNextPage ? endCursor : undefined
  } while (o.after)
}

const getBatchPage = (o) => {
  if (!o) return null
  const { after, login } = o
  body.variables.after = after
  body.variables.login = login
  // return got("https://api.github.com/graphql", { ...gotOpts, body }).then(yup).then(() => null)
  // return got("https://api.github.com/graphql", { ...gotOpts, body }).then(yup)
  return got("https://api.github.com/graphql", { ...gotOpts, body })
}

const tr = through.obj(({ login, ...data }, enc, cb) => {
  if (!(data.repositoriesContributedTo && (data.repositoriesContributedTo.totalCount > 100))) return cb()

  console.log(`${data.repositoriesContributedTo.totalCount} repos for ${login}`)
  // return cb()

  /*
  if (!(data.repositoriesContributedTo && data.repositoriesContributedTo.totalCount)) {
  // if (!(data.repositories && data.repositories.totalCount)) {
    // console.log('No repos for', login)
    return cb()
  }

  if (data.repositoriesContributedTo.totalCount > 100) console.log(`${data.repositoriesContributedTo.totalCount} repos for ${login}`)
  // if (data.repositories.totalCount > 100) console.log(`${data.repositories.totalCount} repos for ${login}`)
  return cb()
  */

  beenThere(login)
    .then(getBatch)
    .then(cb)
    .catch(cb)
})

const str = db.createValueStream({
  gt: 'userId:',
  lt: 'userId:\ufff0',
})

pipeline(str, tr, (err) => {
  if (err) return console.error(err)
  console.error("Done!")
})
