'use strict'

// core
const fs = require('fs')

// npm
const got = require("got")
const delay = require("delay")
const level = require("level")

const perPage = 5
const db = level('dbdbdoo', { valueEncoding: 'json' })
const query = fs.readFileSync('users.graphql', 'utf8')
const variables = { perPage }
const body = { query, variables }

const gotOpts = {
  retry: { methods: ['POST'] },
  json: true,
  headers: { authorization: `bearer ${process.env.GITHUB_TOKEN}` }
}

const speedsWindow = 20
let speedsSum = 0
let speedsCount = 0

const usersPerSecond = (m) => Math.round(10000 / m) / 10

const fixOrg = ({ description, ...o }) => description ? { ...o, description } : o

const fix = ({ websiteUrl, isBountyHunter, isCampusExpert, isEmployee, isHireable, isSiteAdmin, isDeveloperProgramMember, name, company, bio, followers, following, publicKeys, watching, starredRepositories, email, createdAt, updatedAt, ...value }) => {
  value.createdAt = Date.parse(createdAt)
  value.updatedAt = Date.parse(updatedAt)
  if (value.organizations.totalCount) {
    value.organizations.nodes = value.organizations.nodes.map(fixOrg)
  } else {
    delete value.organizations
  }
  if (!(value.repositories.totalCount && value.repositories.totalDiskUsage)) delete value.repositories
  if (!(value.repositoriesContributedTo.totalCount && value.repositoriesContributedTo.totalDiskUsage)) delete value.repositoriesContributedTo
  if (email) value.email = email
  if (websiteUrl) value.websiteUrl = websiteUrl
  if (name) value.name = name
  if (company) value.company = company
  if (bio) value.bio = bio
  if (isBountyHunter) value.isBountyHunter = true
  if (isCampusExpert) value.isCampusExpert = true
  if (isEmployee) value.isEmployee = true
  if (isHireable) value.isHireable = true
  if (isSiteAdmin) value.isSiteAdmin = true
  if (isDeveloperProgramMember) value.isDeveloperProgramMember = true
  if (followers.totalCount) value.followers = followers.totalCount
  if (following.totalCount) value.following = following.totalCount
  if (publicKeys.totalCount) value.publicKeys = publicKeys.totalCount
  if (watching.totalCount) value.watching = watching.totalCount
  if (starredRepositories.totalCount) value.starredRepositories = starredRepositories.totalCount
  const key = `userId:${value.id}`
  return {
    type: 'put',
    key,
    value
  }
}

const yup = (now, { body: { data: { user: { following: { pageInfo, totalCount, nodes } } } }, headers: { date, ...headers } }) => {
  date = Date.parse(date)
  const reset = 1000 * parseInt(headers['x-ratelimit-reset'], 10)
  const rateLimit = {
    timeLeft: reset - date,
    limit: parseInt(headers['x-ratelimit-limit'], 10),
    remaining: parseInt(headers['x-ratelimit-remaining'], 10),
    reset
  }
  const nextPage = pageInfo.hasNextPage && pageInfo.endCursor
  const el = Date.now() - now
  const batch = []

  const itemCount = nodes.length
  if (nextPage) {
    batch.push({
      type: 'put',
      key: '_cursor:nextFollowingPage',
      value: {
        el,
        date,
        totalCount,
        rateLimit,
        nextPage
      }
    })
  }

  nodes.map(fix).forEach((x) => {
    batch.push(x)
    const y = {
      type: 'put',
      key: `userLogin:${x.value.login}`,
      value: x.key
    }
    batch.push(y)
  })
  return { itemCount, rateLimit, totalCount, nextPage, batch, el }
}

const getBatch = (after) => {
  body.variables.after = after
  const now = Date.now()
  return got("https://api.github.com/graphql", { ...gotOpts, body }).then((o) => yup(now, o))
}

const info = ({ itemCount, rateLimit, totalCount, batch, el }) => {
  console.log(JSON.stringify(rateLimit))
  const ms = el / itemCount

  speedsSum += ms
  ++speedsCount

  const avg = Math.round(speedsSum / speedsCount)

  if (speedsCount === speedsWindow) {
    speedsCount /= 2
    speedsSum = Math.floor(speedsSum / 2)
  }

  const va = {
    totalCount,
    elapsed: Math.round(el / 100) / 10,
    ups: usersPerSecond(ms),
    upsAvg: usersPerSecond(avg),
    count: (perPage === itemCount) ? undefined : itemCount
  }

  console.log(JSON.stringify(va))
  return batch
}

const run = async (restart) => {
  let nextPage

  if (!restart) {
    const { nextPage: nextPage2, ...rest } = await db.get('_cursor:nextFollowingPage')
    nextPage = nextPage2
    console.log('LAST RUN:', rest, nextPage)
  }

  while (restart || nextPage) {
    restart = false
    let a
    try {
      a = await getBatch(nextPage)
    } catch (e) {
      if (!(e.headers && e.headers['retry-after'])) throw e
      console.error(e)
      const waitFor = parseInt(e.headers['retry-after'], 10)
      console.error(`\nWaiting ${waitFor}s`)
      await delay(1000 * waitFor)
      a = await getBatch(nextPage)
    }
    if (!a) break
    nextPage = a.nextPage
    const b = info(a)
    db.batch(b).catch((e) => {
      console.error(nextPage)
      console.error(e)
      nextPage = false
    })
  }
}

run().then(console.error).catch(console.error)
