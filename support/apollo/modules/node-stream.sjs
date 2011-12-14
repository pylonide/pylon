/*
 * Oni Apollo 'node-stream' module
 * Stratified helpers for dealing nodejs's async streams
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
  @module    node-stream
  @summary   Stratified helpers for dealing nodejs's async streams
  @hostenv   nodejs
*/

if (require('sjs:apollo-sys').hostenv != 'nodejs')
  throw new Error('node-stream only runs in a nodejs environment');


/**
  @function read
  @summary  Read a single piece of data from `stream`.
  @param    {Stream} [stream] the stream to read from
  @desc
    This function blocks until the first `data` event is recieved
    on the stream, and returns that data. Returns `null` if the
    stream has ended.

    If stream emits `error`, the error is thrown.

    Calls `resume` on the stream before waiting for data,
    and calls `pause` on the stream after data is returned.
    This ensures that no data is emitted between calls to `read()`.
*/
// implementation in apollo-sys-nodejs.sjs
exports.read = require('sjs:apollo-sys').readStream;

/**
  @function readAll
  @summary  Read and return the entire contents of `stream` as a single string.
  @param    {Stream} [stream] the stream to read from
  @desc
    Repeatedly calls `read` until the stream ends. This function
    should not be used on infinite or large streams, as it will buffer the
    entire contents in memory.
*/
exports.readAll = function(stream) {
  var result = [];
  var data;
  while((data = exports.read(stream)) !== null) {
    result.push(data);
  }
  return result.join('');
};


/**
  @function write
  @summary  Write data to the `dest` stream.
  @param    {Stream} [dest] the stream to write to
  @param    {String} [data] the data to write
  @desc
    If the data cannot be written immediately, this function
    will wait for a `drain` event on the `dest` stream before
    returning.

    Any additional arguments (after `data`) are passed through
    to the underlying `write` function.
*/
exports.write = function(dest, data/*, ...*/) {
  var wrote = dest.write.apply(dest, Array.prototype.slice.call(arguments, 1));
  if(!wrote) {
    waitfor() {
      dest.on('drain', resume);
    } finally {
      dest.removeListener('drain', resume);
    }
  }
};


/**
  @function pump
  @summary  Keep writing data from `src` into `dest` until `src` ends.
  @param    {Stream} [src] the source stream
  @param    {String} [dest] the destination stream
  @param    {optional Function} [fn] the processing function
  @desc
    This function will not return until the `src` stream has ended,
    although it will not send `end` to `dest`.

    If `fn` is provided, each piece of data will be passed through
    it in turn. e.g. to produce an uppercase version of a stream:

        stream.pump(src, dest, function(data) { return data.toUpperCase(); })
*/
exports.pump = function(src, dest, fn) {
  var data;
  while((data = exports.read(src)) !== null) {
    if(fn) data = fn(data);
    exports.write(dest, data);
  }
};


/**
  @class    ReadableStringStream
  @summary  An in-memory Stream wrapping a single String.
  @desc
    This class is similar to StringIO in other languages,
    it allows the user to present a `String` as if it were a nodejs `Stream`.

    The stream will emit a single `data` event with the provided string. `pause()`
    and `resume()` can be used to delay this event, and `destroy()` to cancel it.

  @function ReadableStringStream
  @summary  Constructor for a ReadableStringStream object.
  @return   {ReadableStringStream}
  @param    {String} [data] The data for this stream to emit
*/
var ReadableStringStream = exports.ReadableStringStream = function(data) {
  this.data = data;
  this.paused = false;
  this.done = false;
  this.resume();
};

require('util').inherits(ReadableStringStream, require('stream').Stream);

ReadableStringStream.prototype.toString = function() {
  return "#<ReadableStringStream of data: " + data + ">";
};
ReadableStringStream.prototype.pause = function() {
  this.paused = true;
};
ReadableStringStream.prototype.resume = function() {
  this.paused = false;
  // delayed in order to give the creator a chance to pause()
  // this stream before it emits anything
  spawn((function() {
    hold(0);
    if(this.paused) return;
    this.emit('data', this.data);
    if(!this.done) {
      this.destroy();
    }
  }).call(this));
};
ReadableStringStream.prototype.destroy = function() {
  this.emit('end');
  this.done = true;
  this.data = null;
};
ReadableStringStream.prototype.setEncoding = function() {
  throw new Error("Can't set encoding on ReadableStringStream");
};
