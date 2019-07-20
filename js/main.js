// self
import spec from "./s2.json"
import data from "../f2.json"

// npm
import * as vega from "vega"

const n1 = Date.now()
const view = new vega.View(
  vega.parse(spec),
  { container: "#viz", hover: true }
)

const n2 = Date.now()
console.log('T1', n2 - n1)

view
  .insert("funding", data)
  .runAsync()
  .then(() => console.log('T2', Date.now() - n2))
  .catch(console.error)
