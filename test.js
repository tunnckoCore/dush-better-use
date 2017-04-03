/*!
 * dush-better-use <https://github.com/tunnckoCore/dush-better-use>
 *
 * Copyright (c) Charlike Mike Reagent <@tunnckoCore> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

/* jshint asi:true */

'use strict'

var dush = require('dush')
var test = require('mukla')
var betterUse = require('./index')

var Base = require('base')
var app = dush().use(betterUse())

test('should `.use(name, fn)` add named plugin', function (done) {
  var called = 0
  app.use('foobar', function (app) {
    called++
  })
  app.use('quxie', function (app) {
    called++
  })

  test.strictEqual(called, 2)
  test.strictEqual(app.registered.foobar, true)
  test.strictEqual(app.registered.quxie, true)
  done()
})

test('should `.use(namedFn)` add named plugin if non-anonymous fn', function (done) {
  var called = 0
  app.use(function barry () {
    called++
  })

  test.strictEqual(called, 1)
  test.strictEqual(app.registered.barry, true)
  done()
})

test('should anonymous plugins not be registered at `app.registered` store', function (done) {
  var app = dush().use(betterUse())
  app.once('error', done)

  app.use(function (app, options) {
    test.strictEqual(options.foo, 'bar')
    app.foo = 123
  }, { foo: 'bar' })
  app.use(function (app) {
    app.bar = 555
  })

  test.strictEqual(app.foo, 123)
  test.strictEqual(app.bar, 555)
  test.deepEqual(app.registered, { 'dush-better-use': true })
  done()
})

test('should emit `error` event if plugin fail', function (done) {
  app.once('error', function (err) {
    test.strictEqual(err instanceof Error, true)
    test.strictEqual(err.message, 'foo bar')
    test.strictEqual(err._pluginName, 'xyzPlugin')
    done()
  })
  app.use(function xyzPlugin (app) {
    throw new Error('foo bar')
  })
})

test('should emit `error` event if .use not have at least on argument function', function (done) {
  app.once('error', function (err) {
    test.strictEqual(/expect at least one argument function/.test(err.message), true)
    done()
  })
  app.use(123)
})

test('should register/call/invoke named plugins only once', function (done) {
  var app = dush().use(betterUse())
  var called = 0

  function plugin (app, options) {
    test.strictEqual(options.bar, 'qux')
    app.xx = 1
    called++
  }

  app.on('error', done)
  app.use('somePlugin', plugin, { bar: 'qux' })
  app.use('somePlugin', plugin)
  app.use('somePlugin', plugin)

  test.strictEqual(called, 1)
  test.strictEqual(app.xx, 1)
  test.strictEqual(app.registered.somePlugin, true)
  done()
})

test('should always pass options object to plugin, empty object if not passed', function (done) {
  app.use(function (app, options) {
    test.strictEqual(typeof options, 'object')
    test.strictEqual(Object.keys(options).length, 0)
    done()
  })
})

test('should work for Base apps', function (done) {
  var base = new Base()

  base.on('error', done)
  base.use(betterUse())

  base.use('hihi', function (app) {
    app.hihi = 1
  })
  base.use(function (app, base, options) {
    test.deepEqual(options, { foo: 'bar' })
    app.hell = 2
  }, { foo: 'bar' })

  test.strictEqual(base.hihi, 1)
  test.strictEqual(base.hell, 2)
  test.strictEqual(base.registered.hihi, true)
  done()
})
