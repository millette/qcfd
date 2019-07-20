// npm
import embed from "vega-embed"

// self
import spec from "./spec.json"
import data from "../f2.json"

embed("#viz", spec)
  .then(({ view }) => Promise.all([
    view.insert("funding", data),
    view.runAsync(),
  ]))
  .catch(console.error)
