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

// #ifdef __WITH_MD4

apf.crypto.MD4 = {
    /*
     * Configurable variables. You may need to tweak these to be compatible with
     * the server-side, but the defaults work in most cases.
     */
    hexcase: 0,  /* hex output format. 0 - lowercase; 1 - uppercase        */
    b64pad : "", /* base-64 pad character. "=" for strict RFC compliance   */
    chrsz  : 8,  /* bits per input character. 8 - ASCII; 16 - Unicode      */

    /*
     * These are the functions you'll usually want to call
     */
    hex_md4: function(s){
        return this.binl2hex(this.core_md4(this.str2binl(s), s.length * this.chrsz));
    },
    
    b64_md4: function(s){
        return this.binl2b64(this.core_md4(this.str2binl(s), s.length * this.chrsz));
    },
    
    str_md4: function(s){
        return this.binl2str(this.core_md4(this.str2binl(s), s.length * this.chrsz));
    },
    
    hex_hmac_md4: function(key, data){
        return this.binl2hex(this.core_hmac_md4(key, data));
    },
    
    b64_hmac_md4: function(key, data){
        return this.binl2b64(this.core_hmac_md4(key, data));
    },
    
    str_hmac_md4: function(key, data){
        return this.binl2str(this.core_hmac_md4(key, data));
    },
    
    /**
     * Perform a simple self-test to see if the VM is working
     */
    md4_vm_test: function(){
        return this.hex_md4("abc") == "a448017aaf21d8525fc10ae87aa6729d";
    },
    
    /**
     * Calculate the MD4 of an array of little-endian words, and a bit length
     */
    core_md4: function(x, len){
        /* append padding */
        x[len >> 5] |= 0x80 << (len % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;
        
        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;
        
        for (var i = 0; i < x.length; i += 16) {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;
            
            a = this.md4_ff(a, b, c, d, x[i + 0], 3);
            d = this.md4_ff(d, a, b, c, x[i + 1], 7);
            c = this.md4_ff(c, d, a, b, x[i + 2], 11);
            b = this.md4_ff(b, c, d, a, x[i + 3], 19);
            a = this.md4_ff(a, b, c, d, x[i + 4], 3);
            d = this.md4_ff(d, a, b, c, x[i + 5], 7);
            c = this.md4_ff(c, d, a, b, x[i + 6], 11);
            b = this.md4_ff(b, c, d, a, x[i + 7], 19);
            a = this.md4_ff(a, b, c, d, x[i + 8], 3);
            d = this.md4_ff(d, a, b, c, x[i + 9], 7);
            c = this.md4_ff(c, d, a, b, x[i + 10], 11);
            b = this.md4_ff(b, c, d, a, x[i + 11], 19);
            a = this.md4_ff(a, b, c, d, x[i + 12], 3);
            d = this.md4_ff(d, a, b, c, x[i + 13], 7);
            c = this.md4_ff(c, d, a, b, x[i + 14], 11);
            b = this.md4_ff(b, c, d, a, x[i + 15], 19);
            
            a = this.md4_gg(a, b, c, d, x[i + 0], 3);
            d = this.md4_gg(d, a, b, c, x[i + 4], 5);
            c = this.md4_gg(c, d, a, b, x[i + 8], 9);
            b = this.md4_gg(b, c, d, a, x[i + 12], 13);
            a = this.md4_gg(a, b, c, d, x[i + 1], 3);
            d = this.md4_gg(d, a, b, c, x[i + 5], 5);
            c = this.md4_gg(c, d, a, b, x[i + 9], 9);
            b = this.md4_gg(b, c, d, a, x[i + 13], 13);
            a = this.md4_gg(a, b, c, d, x[i + 2], 3);
            d = this.md4_gg(d, a, b, c, x[i + 6], 5);
            c = this.md4_gg(c, d, a, b, x[i + 10], 9);
            b = this.md4_gg(b, c, d, a, x[i + 14], 13);
            a = this.md4_gg(a, b, c, d, x[i + 3], 3);
            d = this.md4_gg(d, a, b, c, x[i + 7], 5);
            c = this.md4_gg(c, d, a, b, x[i + 11], 9);
            b = this.md4_gg(b, c, d, a, x[i + 15], 13);
            
            a = this.md4_hh(a, b, c, d, x[i + 0], 3);
            d = this.md4_hh(d, a, b, c, x[i + 8], 9);
            c = this.md4_hh(c, d, a, b, x[i + 4], 11);
            b = this.md4_hh(b, c, d, a, x[i + 12], 15);
            a = this.md4_hh(a, b, c, d, x[i + 2], 3);
            d = this.md4_hh(d, a, b, c, x[i + 10], 9);
            c = this.md4_hh(c, d, a, b, x[i + 6], 11);
            b = this.md4_hh(b, c, d, a, x[i + 14], 15);
            a = this.md4_hh(a, b, c, d, x[i + 1], 3);
            d = this.md4_hh(d, a, b, c, x[i + 9], 9);
            c = this.md4_hh(c, d, a, b, x[i + 5], 11);
            b = this.md4_hh(b, c, d, a, x[i + 13], 15);
            a = this.md4_hh(a, b, c, d, x[i + 3], 3);
            d = this.md4_hh(d, a, b, c, x[i + 11], 9);
            c = this.md4_hh(c, d, a, b, x[i + 7], 11);
            b = this.md4_hh(b, c, d, a, x[i + 15], 15);
            
            a = this.safe_add(a, olda);
            b = this.safe_add(b, oldb);
            c = this.safe_add(c, oldc);
            d = this.safe_add(d, oldd);
            
        }
        return Array(a, b, c, d);
        
    },
    
    /*
     * These functions implement the basic operation for each round of the
     * algorithm.
     */
    md4_cmn: function(q, a, b, x, s, t){
        return this.safe_add(rol(this.safe_add(this.safe_add(a, q), this.safe_add(x, t)), s), b);
    },
    
    md4_ff: function(a, b, c, d, x, s){
        return this.md4_cmn((b & c) | ((~ b) & d), a, 0, x, s, 0);
    },
    
    md4_gg: function(a, b, c, d, x, s){
        return this.md4_cmn((b & c) | (b & d) | (c & d), a, 0, x, s, 1518500249);
    },
    
    md4_hh: function(a, b, c, d, x, s){
        return this.md4_cmn(b ^ c ^ d, a, 0, x, s, 1859775393);
    },
    
    /**
     * Calculate the HMAC-MD4, of a key and some data
     */
    core_hmac_md4: function(key, data){
        var bkey = this.str2binl(key);
        if (bkey.length > 16) 
            bkey = this.core_md4(bkey, key.length * this.chrsz);
        
        var ipad = Array(16), opad = Array(16);
        for (var i = 0; i < 16; i++) {
            ipad[i] = bkey[i] ^ 0x36363636;
            opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        
        var hash = this.core_md4(ipad.concat(this.str2binl(data)), 512 + data.length * this.chrsz);
        return this.core_md4(opad.concat(hash), 512 + 128);
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
     * Convert a string to an array of little-endian words
     * If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
     */
    str2binl: function(str){
        var bin = Array();
        var mask = (1 << this.chrsz) - 1;
        for (var i = 0; i < str.length * this.chrsz; i += this.chrsz) 
            bin[i >> 5] |= (str.charCodeAt(i / this.chrsz) & mask) << (i % 32);
        return bin;
    },
    
    /**
     * Convert an array of little-endian words to a string
     */
    binl2str: function(bin){
        var str = "";
        var mask = (1 << this.chrsz) - 1;
        for (var i = 0; i < bin.length * 32; i += this.chrsz) 
            str += String.fromCharCode((bin[i >> 5] >>> (i % 32)) & mask);
        return str;
    },
    
    /**
     * Convert an array of little-endian words to a hex string.
     */
    binl2hex: function(binarray){
        var hex_tab = this.hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var str = "";
        for (var i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
            hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
        }
        return str;
    },
    
    /**
     * Convert an array of little-endian words to a base-64 string
     */
    binl2b64: function(binarray){
        var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var str = "";
        for (var i = 0; i < binarray.length * 4; i += 3) {
            var triplet = (((binarray[i >> 2] >> 8 * (i % 4)) & 0xFF) << 16) |
            (((binarray[i + 1 >> 2] >> 8 * ((i + 1) % 4)) & 0xFF) << 8) |
            ((binarray[i + 2 >> 2] >> 8 * ((i + 2) % 4)) & 0xFF);
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
