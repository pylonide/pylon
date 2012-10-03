/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

//#ifdef __TESTS

"use strict";
/*global apf*/
global.apf = {};

var Assert = require("assert");
require("./utilities");
require("./xml");

// test unescapeXML:

Assert.equal(apf.unescapeXML("ser&#60;script&#62;ver.js"), "ser<script>ver.js");
Assert.equal(apf.unescapeXML("ser<script>ver.js"), "ser<script>ver.js");
Assert.equal(apf.unescapeXML("Long &#60;string&#62; with &#9829; wicked XML entities &#9830; in it: &uarr; ."), "Long <string> with &hearts; wicked XML entities &diams; in it: &uarr; .");

//#endif