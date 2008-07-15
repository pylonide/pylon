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

// #ifdef __WITH_SHA1

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */
if (typeof jpf.crypt == "undefined") jpf.crypt = {};

jpf.crypt.SHA1 = {
    /*
     * Configurable variables. You may need to tweak these to be compatible with
     * the server-side, but the defaults work in most cases.
     */
    hexcase: 0,  /* hex output format. 0 - lowercase; 1 - uppercase        */
    b64pad : "", /* base-64 pad character. "=" for strict RFC compliance   */
    chrsz  : 8,  /* bits per input character. 8 - ASCII; 16 - Unicode      */

    /*
     * These are the functions you'll usually want to call
     * They take string arguments and return either hex or base-64 encoded strings
     */
    hex_sha1: function(s){
        return this.binb2hex(this.core_sha1(this.str2binb(s), s.length * this.chrsz));
    },
    
    b64_sha1: function(s){
        return this.binb2b64(this.core_sha1(this.str2binb(s), s.length * this.chrsz));
    },
    
    str_sha1: function(s){
        return this.binb2str(this.core_sha1(this.str2binb(s), s.length * this.chrsz));
    },
    
    hex_hmac_sha1: function(key, data){
        return this.binb2hex(this.core_hmac_sha1(key, data));
    },
    
    b64_hmac_sha1: function(key, data){
        return this.binb2b64(this.core_hmac_sha1(key, data));
    },
    
    str_hmac_sha1: function(key, data){
        return this.binb2str(this.core_hmac_sha1(key, data));
    },
    
    /**
     * Perform a simple self-test to see if the VM is working
     */
    sha1_vm_test: function(){
        return this.hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
    },
    
    /**
     * Calculate the SHA-1 of an array of big-endian words, and a bit length
     */
    core_sha1: function(x, len){
        /* append padding */
        x[len >> 5] |= 0x80 << (24 - len % 32);
        x[((len + 64 >> 9) << 4) + 15] = len;
        
        var w = Array(80);
        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;
        var e = -1009589776;
        
        for (var i = 0; i < x.length; i += 16) {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;
            var olde = e;
            
            for (var j = 0; j < 80; j++) {
                if (j < 16) 
                    w[j] = x[i + j];
                else 
                    w[j] = this.rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                var t = this.safe_add(this.safe_add(rol(a, 5), this.sha1_ft(j, b, c, d)),
                    this.safe_add(this.safe_add(e, w[j]), this.sha1_kt(j)));
                e = d;
                d = c;
                c = this.rol(b, 30);
                b = a;
                a = t;
            }
            
            a = this.safe_add(a, olda);
            b = this.safe_add(b, oldb);
            c = this.safe_add(c, oldc);
            d = this.safe_add(d, oldd);
            e = this.safe_add(e, olde);
        }
        return Array(a, b, c, d, e);
        
    },
    
    /**
     * Perform the appropriate triplet combination for the current
     * iteration
     */
    sha1_ft: function(t, b, c, d){
        if (t < 20) 
            return (b & c) | ((~ b) & d);
        if (t < 40) 
            return b ^ c ^ d;
        if (t < 60) 
            return (b & c) | (b & d) | (c & d);
        return b ^ c ^ d;
    },
    
    /**
     * Determine the appropriate additive constant for the current iteration
     */
    sha1_kt: function(t){
        return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514;
    },
    
    /**
     * Calculate the HMAC-SHA1 of a key and some data
     */
    core_hmac_sha1: function(key, data){
        var bkey = this.str2binb(key);
        if (bkey.length > 16) 
            bkey = this.core_sha1(bkey, key.length * this.chrsz);
        
        var ipad = Array(16), opad = Array(16);
        for (var i = 0; i < 16; i++) {
            ipad[i] = bkey[i] ^ 0x36363636;
            opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        
        var hash = this.core_sha1(ipad.concat(str2binb(data)), 512 + data.length * this.chrsz);
        return this.core_sha1(opad.concat(hash), 512 + 160);
    },
    
    /**
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     */
    safe_add: function(x, y){
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    },
    
    /**
     * Bitwise rotate a 32-bit number to the left.
     */
    rol: function(num, cnt){
        return (num << cnt) | (num >>> (32 - cnt));
    },
    
    /**
     * Convert an 8-bit or 16-bit string to an array of big-endian words
     * In 8-bit function, characters >255 have their hi-byte silently ignored.
     */
    str2binb: function(str){
        var bin = Array();
        var mask = (1 << this.chrsz) - 1;
        for (var i = 0; i < str.length * this.chrsz; i += this.chrsz) 
            bin[i >> 5] |= (str.charCodeAt(i / this.chrsz) & mask) << (32 - this.chrsz - i % 32);
        return bin;
    },
    
    /**
     * Convert an array of big-endian words to a string
     */
    binb2str: function(bin){
        var str = "";
        var mask = (1 << this.chrsz) - 1;
        for (var i = 0; i < bin.length * 32; i += this.chrsz) 
            str += String.fromCharCode((bin[i >> 5] >>> (32 - this.chrsz - i % 32)) & mask);
        return str;
    },
    
    /**
     * Convert an array of big-endian words to a hex string.
     */
    binb2hex: function(binarray){
        var hex_tab = this.hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var str = "";
        for (var i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
            hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
        }
        return str;
    },
    
    /**
     * Convert an array of big-endian words to a base-64 string
     */
    binb2b64: function(binarray){
        var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var str = "";
        for (var i = 0; i < binarray.length * 4; i += 3) {
            var triplet = (((binarray[i >> 2] >> 8 * (3 - i % 4)) & 0xFF) << 16) |
            (((binarray[i + 1 >> 2] >> 8 * (3 - (i + 1) % 4)) & 0xFF) << 8) |
            ((binarray[i + 2 >> 2] >> 8 * (3 - (i + 2) % 4)) & 0xFF);
            for (var j = 0; j < 4; j++) {
                if (i * 8 + j * 6 > binarray.length * 32) 
                    str += this.b64pad;
                else 
                    str += tab.charAt((triplet >> 6 * (3 - j)) & 0x3F);
            }
        }
        return str;
    }
};

// #endif
