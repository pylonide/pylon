/*
 * Oni Apollo JS bootstrap code, hostenv-specific part
 *
 * Cross-browser ('xbrowser') version
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

if (!__oni_rt.sys) {
  
  //----------------------------------------------------------------------
  // Install SJS system module ('sjs:apollo-sys'). Bootstrapping will be
  // run from there.
  // The system module is spread over two parts: the 'common' part, and the
  // 'hostenv' specific part. 
  // hostenv is one of : 'xbrowser' | 'nodejs' 
  __oni_rt.G.eval("(function(exports) {"+
                  __oni_rt.c1.compile(__oni_rt.modsrc['sjs:apollo-sys-common.sjs'],
                                      {filename:"apollo-sys-common.sjs"})+"\n"+
                  __oni_rt.c1.compile(__oni_rt.modsrc['sjs:apollo-sys-'+__oni_rt.hostenv+'.sjs'],
                                      {filename:"apollo-sys-"+__oni_rt.hostenv+".sjs"})+
                 "})({})");
  delete __oni_rt.modsrc['sjs:apollo-sys-common.sjs'];
  delete __oni_rt.modsrc['sjs:apollo-sys-'+__oni_rt.hostenv+'.sjs']; 
}



