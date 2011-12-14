/*
 * Oni Apollo JS bootstrap code, hostenv-specific part
 *
 * NodeJS-based ('nodejs') version
 *
 * Part of the Oni Apollo StratifiedJS Runtime
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

//----------------------------------------------------------------------
// Install Apollo system module ('sjs:apollo-sys'). Bootstrapping will be
// run from there.
// The system module is spread over two parts: the 'common' part, and the
// 'hostenv' specific part. 
// hostenv is one of : 'xbrowser' | 'nodejs' 
var rt = global.__oni_rt;

// save some environment info:
var path = require('path');
var fs = require('fs');

global.__oni_rt.nodejs_require = require;
global.__oni_rt.nodejs_apollo_lib_dir = path.join(path.dirname(fs.realpathSync(__filename)), 'modules/');

var sys = rt.G.eval("(function(exports) {"+
                    rt.c1.compile(rt.modsrc['sjs:apollo-sys-common.sjs'],
                                  {filename:"apollo-sys-common.sjs"})+"\n"+
                    rt.c1.compile(rt.modsrc['sjs:apollo-sys-'+rt.hostenv+'.sjs'],
                                              {filename:"apollo-sys-"+rt.hostenv+".sjs"})+
                          "})");

// In the nodejs environment, apollo-bootstrap is loaded as a nodejs
// module, with 'exports', etc. Install the sys module on our
// 'exports':
sys(exports);

delete rt.modsrc['sjs:apollo-sys-common.sjs'];
delete rt.modsrc['sjs:apollo-sys-'+rt.hostenv+'.sjs']; 

