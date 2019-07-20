'use strict'

const funds = require("./funds.json")

const out = []

funds.forEach((f) => {
  let r
  const obj = {
    repo: f.repo,
    github: f.funding.github
  }


  for (r in f.funding) {
    if (r === 'github') continue
    out.push({
      ...obj,
      type: r,
      value: f.funding[r]
    })
  }
})

console.log(JSON.stringify(out, null, '  '))
