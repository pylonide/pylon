/*
 * Oni Apollo 'base64' module
 * base64 encoding and decoding
 *
 * Part of the Oni Apollo Standard Module Library
 * Version: 'unstable'
 * http://onilabs.com/apollo
 *
 *
 * Notice from the original code:
 *
 *   This code was written by Tyler Akins and has been placed in the
 *   public domain.  It would be nice if you left this header intact.
 *   Base64 code from Tyler Akins -- http://rumkin.com
 *
 */

/**
  @module    base64
  @summary   base64 encoding and decoding
  @desc
    ###Notice from the original code:

    This code was written by Tyler Akins and has been placed in the
    public domain.  It would be nice if you left this header intact.
    Base64 code from Tyler Akins -- http://rumkin.com
*/

var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

var StringMaker = function () {
	this.str = "";
	this.length = 0;
	this.append = function (s) {
		this.str += s;
		this.length += s.length;
	};
	this.prepend = function (s) {
		this.str = s + this.str;
		this.length += s.length;
	};
	this.toString = function () {
		return this.str;
	};
}

if (require('sjs:apollo-sys').hostenv == 'xbrowser') {
  var ua = navigator.userAgent.toLowerCase();
  if (!(ua.indexOf(" chrome/") >= 0 || ua.indexOf(" firefox/") >= 0 || ua.indexOf(' gecko/') >= 0)) {
	  var StringMaker = function () {
		  this.parts = [];
		  this.length = 0;
		  this.append = function (s) {
			  this.parts.push(s);
			  this.length += s.length;
		  };
		  this.prepend = function (s) {
			  this.parts.unshift(s);
			  this.length += s.length;
		  };
		  this.toString = function () {
			  return this.parts.join('');
		  };
	  }
  }
}

/**
  @function encode
  @param {String} [input] String to encode
*/
exports.encode = function (input) {
	var output = new StringMaker();
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
  
	while (i < input.length) {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);
 
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
 
		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}
 
		output.append(keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4));
   }
   
   return output.toString();
};

/**
  @function decode
  @param {String} [input] String to decode
*/
exports.decode = function (input) {
	var output = new StringMaker();
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
 
	// remove all characters that are not A-Z, a-z, 0-9, +, /, or =
	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
  
	while (i < input.length) {
		enc1 = keyStr.indexOf(input.charAt(i++));
		enc2 = keyStr.indexOf(input.charAt(i++));
		enc3 = keyStr.indexOf(input.charAt(i++));
		enc4 = keyStr.indexOf(input.charAt(i++));
 
		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;
 
		output.append(String.fromCharCode(chr1));
 
		if (enc3 != 64) {
			output.append(String.fromCharCode(chr2));
		}
		if (enc4 != 64) {
			output.append(String.fromCharCode(chr3));
		}
	}
 
	return output.toString();
};
