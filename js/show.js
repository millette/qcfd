// npm
import * as vega from "vega"
// const vega = require('vega')

const show = (spec, { errorHandler, data, dataName, container, ...opts } = {}) => {
  try {
    const parsed = vega.parse(spec)
    const view = new vega.View(parsed, { hover: true, ...opts })
    if (!errorHandler) errorHandler = view.error
    view.error = (error) => { throw new Error(error) }

    if (data || dataName) {
      if (!data) return Promise.reject(new Error("Missing 'data' field, 'dataName' was given."))
      if (!dataName) return Promise.reject(new Error("Missing 'dataName' field, 'data' was given."))
      view.insert(dataName, data)
    }

    if (container) view.initialize(container)
    view.error = errorHandler
    return view.runAsync()
  } catch (e) {
    return Promise.reject(e)
  }
}

export default show
// module.exports = show
