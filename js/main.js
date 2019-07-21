// self
import specA from "./s2.json"
import dataA from "../f2.json"

// self
// import show from "./show.js"
import show from ".."

show(specA, { container: "#viz", dataName: "funding", data: dataA })
  .catch((e) => console.error('Oupsy', e))
