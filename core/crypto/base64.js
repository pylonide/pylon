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

// #ifdef __WITH_BASE64

apf.crypto.Base64 = (function() {
    
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    
    // public method for encoding
    function encode(data) {
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc = "",
            tmp_arr = [];

        if (!data)
            return data;

        data = apf.crypto.UTF8.encode(data + "");

        do { // pack three octets into four hexets
            o1 = data.charCodeAt(i++);
            o2 = data.charCodeAt(i++);
            o3 = data.charCodeAt(i++);

            bits = o1 << 16 | o2 << 8 | o3;

            h1 = bits >> 18 & 0x3f;
            h2 = bits >> 12 & 0x3f;
            h3 = bits >> 6  & 0x3f;
            h4 = bits & 0x3f;

            // use hexets to index into b64, and append result to encoded string
            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3)
                + b64.charAt(h4);
        }
        while (i < data.length);

        enc = tmp_arr.join("");

        switch (data.length % 3) {
            case 1:
                enc = enc.slice(0, -2) + '==';
                break;
            case 2:
                enc = enc.slice(0, -1) + '=';
                break;
        }

        return enc;
    }
    
    // public method for decoding
    function decode(data) {
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, tmp_arr = [];

        if (!data) {
            return data;
        }

        data += "";

        do {  // unpack four hexets into three octets using index points in b64
            h1 = b64.indexOf(data.charAt(i++));
            h2 = b64.indexOf(data.charAt(i++));
            h3 = b64.indexOf(data.charAt(i++));
            h4 = b64.indexOf(data.charAt(i++));

            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

            o1 = bits>>16 & 0xff;
            o2 = bits>>8 & 0xff;
            o3 = bits & 0xff;

            if (h3 == 64)
                tmp_arr[ac++] = String.fromCharCode(o1);
            else if (h4 == 64)
                tmp_arr[ac++] = String.fromCharCode(o1, o2);
            else
                tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
        while (i < data.length);

        return apf.crypto.UTF8.decode(tmp_arr.join(""));
    }
    
    return {
        decode: decode,
        encode: encode
    };
    
})();

apf.crypto.UTF8 = {
    // private method for UTF-8 encoding
    encode : function (string) {
        // Encodes an ISO-8859-1 string to UTF-8
        //
        // version: 905.1217
        // discuss at: http://phpjs.org/functions/utf8_encode
        // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: sowberry
        // +    tweaked by: Jack
        // +   bugfixed by: Onno Marsman
        // +   improved by: Yves Sucaet
        // +   bugfixed by: Onno Marsman
        // *     example 1: utf8_encode('Kevin van Zonneveld');
        // *     returns 1: 'Kevin van Zonneveld'
        string = (string + "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        var tmp_arr = [],
            start   = 0,
            end     = 0,
            c1, enc;

        for (var n = 0, l = string.length; n < l; n++) {
            c1 = string.charCodeAt(n);
            enc = null;

            if (c1 < 128) {
                end++;
            }
            else if ((c1 > 127) && (c1 < 2048)) {
                enc = String.fromCharCode((c1 >> 6) | 192)
                    + String.fromCharCode((c1 & 63) | 128);
            }
            else {
                enc = String.fromCharCode((c1 >> 12) | 224) 
                    + String.fromCharCode(((c1 >> 6) & 63) | 128)
                    + String.fromCharCode((c1 & 63) | 128);
            }
            if (enc !== null) {
                if (end > start)
                    tmp_arr.push(string.substring(start, end));
                tmp_arr.push(enc);
                start = end = n + 1;
            }
        }

        if (end > start)
            tmp_arr.push(string.substring(start, string.length));

        return tmp_arr.join("");
    },

    // private method for UTF-8 decoding
    decode : function (str_data) {
        // Converts a UTF-8 encoded string to ISO-8859-1
        //
        // version: 905.3122
        // discuss at: http://phpjs.org/functions/utf8_decode
        // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // +      input by: Aman Gupta
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Norman "zEh" Fuchs
        // +   bugfixed by: hitwork
        // +   bugfixed by: Onno Marsman
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // *     example 1: utf8_decode('Kevin van Zonneveld');
        // *     returns 1: 'Kevin van Zonneveld'
        var tmp_arr = [], i = 0, ac = 0, c1 = 0, c2 = 0, c3 = 0;

        str_data += "";

        while (i < str_data.length) {
            c1 = str_data.charCodeAt(i);
            if (c1 < 128) {
                tmp_arr[ac++] = String.fromCharCode(c1);
                i++;
            }
            else if ((c1 > 191) && (c1 < 224)) {
                c2 = str_data.charCodeAt(i+1);
                tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = str_data.charCodeAt(i+1);
                c3 = str_data.charCodeAt(i+2);
                tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12)
                    | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }

        return tmp_arr.join('');
    }

};

//#endif
