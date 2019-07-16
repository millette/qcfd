'use strict'

// core
const fs = require('fs')

const query = fs.readFileSync('users.graphql', 'utf8')

const obj = {
  query
}

console.log(JSON.stringify(obj))
