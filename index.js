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

/**
 * > Overrides the default [dush][]/[minibase][]/[base][] `.use` method
 * to support named plugins and to have better error handling. It also
 * adds/registers the [minibase-is-registered][] plugin if not included
 * already, so you will have `.isRegistered` method too. This plugin
 * emits `error` event if something fail in plugin, instead of throwing.
 *
 * **Example**
 *
 * ```js
 * var dush = require('dush')
 * var betterUse = require('dush-better-use')
 *
 * var app = dush()
 * app.use(betterUse())
 * ```
 *
 * @param  {Object} `opts` no options currently
 * @return {Function} a plugin function that should be passed to `.use` method
 * @api public
 */

module.exports = function betterUse (opts) {
  return function betterUse (app) {
    app.use(isRegistered())

    /* istanbul ignore next */
    if (app.isRegistered('dush-better-use')) {
      return
    }

    var oldUse = app.use

    /**
     * > Calls `fn` plugin immediately once, if `name` is string
     * it registers it as "named" plugin so you can find its
     * name at `app.registered` cache. It also emits `error` event
     * if plugin `fn` throws.
     *
     * **Example**
     *
     * ```js
     * var called = 0
     *
     * function plugin (app) {
     *   app.foo = 123
     *   called++
     * }
     *
     * app.use('foobar', plugin)
     * app.use('foobar', plugin)
     * app.use('foobar', plugin)
     *
     * console.log(called) // => 1
     * console.log(app.foo) // => 123
     * console.log(app.registered) // => { 'foobar': true }
     *
     * // if something fails in a plugin
     * // it emits `error` event
     * app.once('error', (err) => {
     *   console.log('ERR!', err.toString()) // => Error: sadly error
     * })
     * app.use((app) => {
     *   throw new Error('sadly error')
     * })
     * ```
     *
     * @param  {Function|String}   `name` name of the plugin or `fn` plugin function
     * @param  {Function} `fn` a plugin function, called immedately
     * @return {Object} self "app" for chaining
     * @api public
     */

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
      if (app.isRegistered(name)) {
        return
      }

      oldUse(fn)
      return app
    }
  }
}
