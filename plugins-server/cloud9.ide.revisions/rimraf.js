/*
 * Copyright 2009, 2010, 2011 Isaac Z. Schlueter.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * This is a slightly modified copy of the rimraf module that gets the
 * filesystem from the `fs` parameter passed to the constructor, in order to be
 * compatible with Cloud9's sandboxed fs. The sync rimraf has been removed
 * since we have no use for it in Cloud9.
 */

module.exports = rimraf

var path = require("path");
var fs;

var lstat = process.platform === "win32" ? "stat" : "lstat"
  , lstatSync = lstat + "Sync"

// for EMFILE handling
var timeout = 0
exports.EMFILE_MAX = 1000
exports.BUSYTRIES_MAX = 3

function rimraf (p, cb, _fs) {

  if (!cb) throw new Error("No callback passed to rimraf()")
  if (!_fs) throw new Error("No filesystem module passed to rimraf()")

  fs = _fs;

  var busyTries = 0

  rimraf_(p, function CB (er) {
    if (er) {
      if (er.code === "EBUSY" && busyTries < exports.BUSYTRIES_MAX) {
        var time = (exports.BUSYTRIES_MAX - busyTries) * 100
        busyTries ++
        // try again, with the same exact callback as this one.
        return setTimeout(function () {
          rimraf_(p, CB)
        })
      }

      // this one won't happen if graceful-fs is used.
      if (er.code === "EMFILE" && timeout < exports.EMFILE_MAX) {
        return setTimeout(function () {
          rimraf_(p, CB)
        }, timeout ++)
      }

      // already gone
      if (er.code === "ENOENT") er = null
    }

    timeout = 0
    cb(er)
  })
}

function rimraf_ (p, cb) {
  fs[lstat](p, function (er, s) {
    if (er) {
      // already gone
      if (er.code === "ENOENT") return cb()
      // some other kind of error, permissions, etc.
      return cb(er)
    }

    return rm_(p, s, false, cb)
  })
}


var myGid = function myGid () {
  var g = process.getuid && process.getgid()
  myGid = function myGid () { return g }
  return g
}

var myUid = function myUid () {
  var u = process.getuid && process.getuid()
  myUid = function myUid () { return u }
  return u
}


function writable (s) {
  var mode = s.mode || 0777
    , uid = myUid()
    , gid = myGid()
  return (mode & 0002)
      || (gid === s.gid && (mode & 0020))
      || (uid === s.uid && (mode & 0200))
}

function rm_ (p, s, didWritableCheck, cb) {
  if (!didWritableCheck && !writable(s)) {
    // make file writable
    // user/group/world, doesn't matter at this point
    // since it's about to get nuked.
    return fs.chmod(p, s.mode | 0222, function (er) {
      if (er) return cb(er)
      rm_(p, s, true, cb)
    })
  }

  if (!s.isDirectory()) {
    return fs.unlink(p, cb)
  }

  // directory
  fs.readdir(p, function (er, files) {
    if (er) return cb(er)
    asyncForEach(files.map(function (f) {
      return path.join(p, f)
    }), function (file, cb) {
      rimraf(file, cb, fs)
    }, function (er) {
      if (er) return cb(er)
      fs.rmdir(p, cb)
    })
  })
}

function asyncForEach (list, fn, cb) {
  if (!list.length) cb()
  var c = list.length
    , errState = null
  list.forEach(function (item, i, list) {
    fn(item, function (er) {
      if (errState) return
      if (er) return cb(errState = er)
      if (-- c === 0) return cb()
    })
  })
}


