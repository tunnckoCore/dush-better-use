/*!
 * dush-better-use <https://github.com/tunnckoCore/dush-better-use>
 *
 * Copyright (c) Charlike Mike Reagent <@tunnckoCore> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

'use strict'

var getName = require('get-fn-name')
var tryCatch = require('try-catch-callback')
var isRegistered = require('minibase-is-registered')

module.exports = function betterUse () {
  return function betterUse (app) {
    app.use(isRegistered())

    /* istanbul ignore next */
    if (app.isRegistered('dush-better-use')) {
      return
    }

    var oldUse = app.use

    app.use = function use (name, fn) {
      if (typeof name === 'function') {
        fn = name
        name = getName(fn)
      }
      if (typeof name === 'string') {
        fn = handleNamedPlugin(oldUse)(name, fn)
        fn._pluginName = name
      }

      handleAnonymousPlugin(app, oldUse, fn)
      return app
    }

    return app
  }
}

/**
 * Utils
 */

function handleAnonymousPlugin (app, func, fn) {
  var ret = tryCatch(func, { args: fn, return: true })

  if (ret instanceof Error) {
    ret._pluginName = fn._pluginName
    app.emit('error', ret)
  }
}

function handleNamedPlugin (oldUse) {
  return function __createdPlugin__ (name, fn) {
    return function createdPlugin (app) {
      if (app.isRegistered(name)) return
      oldUse(fn)
      return app
    }
  }
}
