/*
 * Oni Apollo 'node-fs' module
 * Stratified wrapper of nodejs filesystem functionality
 *
 * Part of the Oni Apollo Standard Module Library
 * Version: 'unstable'
 * http://onilabs.com/apollo
 *
 * (c) 2011 Oni Labs, http://onilabs.com
 *
 * This file is licensed under the terms of the MIT License:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
/**
  @module    node-fs
  @summary   Stratified wrapper of [nodejs filesystem functionality](http://nodejs.org/docs/v0.5.8/api/fs.html)
  @hostenv   nodejs
*/

if (require('sjs:apollo-sys').hostenv != 'nodejs') 
  throw new Error('node-fs only runs in a nodejs environment');


var fs = require('fs'); // builtin fs
var events = require('./node-events');

var fs_binding = process.binding('fs');
var write = fs_binding.write;

//----------------------------------------------------------------------
// low-level:

/**
   @function rename
   @summary `rename(2)` system call
   @param {String} [oldpath] Old pathname.
   @param {String} [newpath] New pathname.
   @desc
     Blocks until rename has been performed. Throws if there is an error.
*/
exports.rename = function(oldpath, newpath) {
  waitfor (var err) { fs.rename(oldpath, newpath, resume); }
  if (err) throw err;
};

/**
   @function truncate
   @summary `ftruncate(2)` system call
   @param [fd] File descriptor.
   @param {Integer} [len] Length.
   @desc
     Blocks until truncate has been performed. Throws if there is an error.
*/
exports.truncate = function(fd, len) {
  waitfor (var err) { fs.truncate(fd, len, resume); }
  if (err) throw err;
};

/**
   @function chmod
   @summary `chmod(2)` system call
   @param {String} [path] Pathname.
   @param {Integer} [mode] Mode.
   @desc
     Blocks until chmod has been performed. Throws if there is an error.
*/
exports.chmod = function(path, mode) {
  waitfor (var err) { fs.chmod(path, mode, resume); }
  if (err) throw err;
};

/**
   @function stat
   @summary `stat(2)` system call
   @param {String} [path] Pathname.
   @return {Object}
   @desc
     Throws if there is an error.
     
     The returned
     [`fs.stat`](http://nodejs.org/docs/v0.5.8/api/fs.html#fs.stat)
     object looks like this:

         { dev: 2049,
           ino: 305352,
           mode: 16877,
           nlink: 12,
           uid: 1000,
           gid: 1000,
           rdev: 0,
           size: 4096,
           blksize: 4096,
           blocks: 8,
           atime: '2009-06-29T11:11:55Z',
           mtime: '2009-06-29T11:11:40Z',
           ctime: '2009-06-29T11:11:40Z' }

*/
exports.stat = function(path) {
  waitfor (var err, stats) { fs.stat(path, resume); }
  if (err) throw err;
  return stats;
};

/**
   @function lstat
   @summary `lstat(2)` system call
   @param {String} [path] Pathname.
   @return {Object}
   @desc
     Like [::stat] but doesn't follow symbolic links (i.e. it stats
     the link itself, rather than the file it points to.)
*/
exports.lstat = function(path) {
  waitfor (var err, stats) { fs.lstat(path, resume); }
  if (err) throw err;
  return stats;
};

/**
   @function fstat
   @summary `fstat(2)` system call
   @param [fd] File descriptor.
   @return {Object}
   @desc
     Like [::stat] but the file to be `stat`ed is specified by file descriptor.
*/
exports.fstat = function(fd) {
  waitfor (var err, stats) { fs.fstat(fd, resume); }
  if (err) throw err;
  return stats;
};

/**
   @function link
   @summary `link(2)` system call
   @param {String} [srcpath] Source pathname.
   @param {String} [dstpath] Destination pathname.
   @desc
     Blocks until chmod has been performed. Throws if there is an error.

*/
exports.link = function(srcpath, dstpath) {
  waitfor (var err) { fs.link(srcpath, dstpath, resume); }
  if (err) throw err;
};

/**
   @function symlink
   @summary To be documented
*/
exports.symlink = function(linkdata, path) {
  waitfor (var err) { fs.symlink(linkdata, path, resume); }
  if (err) throw err;
};

/**
   @function readlink
   @summary To be documented
*/
exports.readlink = function(path) {
  waitfor (var err, resolvedPath) { fs.readlink(path, resume); }
  if (err) throw err;
  return resolvedPath;
};

/**
   @function realpath
   @summary To be documented
*/
exports.realpath = function(path) {
  waitfor (var err, resolvedPath) { fs.realpath(path, resume); }
  if (err) throw err;
  return resolvedPath;
};

/**
   @function unlink
   @summary To be documented
*/
exports.unlink = function(path) {
  waitfor (var err) { fs.unlink(path, resume); }
  if (err) throw err;
};

/**
   @function rmdir
   @summary To be documented
*/
exports.rmdir = function(path) {
  waitfor (var err) { fs.rmdir(path, resume); }
  if (err) throw err;
};

/**
   @function mkdir
   @summary To be documented
*/
exports.mkdir = function(path, mode) {
  waitfor (var err) { fs.mkdir(path, mode===undefined ? 0777 : mode, resume); }
  if (err) throw err;
};

/**
   @function readdir
   @summary To be documented
*/
exports.readdir = function(path) {
  waitfor (var err, files) { fs.readdir(path, resume); }
  if (err) throw err;
  return files;
};

/**
   @function close
   @summary To be documented
*/
exports.close = function(fd) {
  waitfor (var err) { fs.close(fd, resume); }
  if (err) throw err;
};

/**
   @function open
   @summary To be documented
*/
exports.open = function(path, flags, mode) {
  var retracted = false;
  waitfor (var err, fd) {
    fs.open(path, flags, mode,
            function(_err, _fd) {
              if (!retracted)
                resume(_err, _fd);
              else
                fs.close(_fd);
            });
  }
  retract {
    retracted = true;
  }
  if (err) throw err;
  return fd;
};

/**
   @function write
   @summary To be documented
*/
exports.write = function(fd, buffer, offset, length, position /*=null*/) {
  if (position === undefined) position = null;
  waitfor (var err, written) {
    write(fd, buffer, offset, length, position, resume);
  }
  if (err) throw err;
  return written;
};

/**
   @function read
   @summary To be documented
*/
exports.read = function(fd, buffer, offset, length, position /*=null*/) {
  if (position === undefined) position = null;
  waitfor (var err, bytesRead) {
    fs.read(fd, buffer, offset, length, position, resume);
  }
  if (err) throw err;
  return bytesRead;
};

/**
   @function readFile
   @summary To be documented
*/
exports.readFile = function(filename, /* opt */ encoding) {
  waitfor (var err, data) { fs.readFile(filename, encoding, resume); }
  if (err) throw err;
  return data;
};

/**
   @function writeFile
   @summary To be documented
*/
exports.writeFile = function(filename, data, encoding /*='utf8'*/) {
  waitfor (var err) { fs.writeFile(filename, data, encoding, resume); }
  if (err) throw err;
};

// XXX watchFile/unwatchFile are a pretty bad interface, in the sense
// that it's not safe to watch/unwatch the same file from different
// places in the code at the same time. We work around that by doing
// our own bookkeeping on top of that in fs.js:
var watchers = {};

/**
   @function waitforChange
   @summary To be documented
*/
exports.waitforChange = function(filename, interval /*=0*/) {
  waitfor (var curr, prev) {
    if (!watchers[filename])
      watchers[filename] = 1;
    else
      ++watchers[filename];
    fs.watchFile(filename,
                 { persistent:true, interval:interval||0},
                 resume);
  }
  finally {
    if (--watchers[filename] <= 0) {
      delete watchers[filename];
      fs.unwatchFile(filename);
    }
  }
  
  return { curr: curr, prev: prev }; 
}; 

//----------------------------------------------------------------------
// high-level

/**
   @function exists
   @summary To be documented
*/
exports.exists = function(path) {
  try {
    exports.stat(path);
    return true;
  }
  catch (e) {
    return false;
  }
};


/**
   @function isFile
   @summary To be documented
*/
exports.isFile = function(path) {
  try {
    return exports.stat(path).isFile();
  }
  catch (e) {
    return false;
  }
};

/**
   @function isDirectory
   @summary To be documented
*/
exports.isDirectory = function(path) {
  try {
    return exports.stat(path).isDirectory();
  }
  catch (e) {
    return false;
  }
};
