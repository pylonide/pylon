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

// #ifdef __WITH_MD5

(function(global) {

function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
}

function addUnsigned(lX, lY) {
    var lX4 = (lX & 0x40000000),
        lY4 = (lY & 0x40000000),
        lX8 = (lX & 0x80000000),
        lY8 = (lY & 0x80000000),
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4)
        return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) {
        if (lResult & 0x40000000)
            return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        else
            return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    }
    else
        return (lResult ^ lX8 ^ lY8);
}

function _FF(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(((b & c) | ((~b) & d)), b), ac));
    return addUnsigned(rotateLeft(a, s), b);
};

function _GG(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(((b & d) | (c & (~d))), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
};

function _HH(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned((b ^ c ^ d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
};

function _II(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned((c ^ (b | (~d))), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
};

function convertToWordArray(str) {
    var cnt,
        l = str.length;
    var words_num  = ((((l + 8)-((l + 8) % 64)) / 64) + 1) * 16;
    var words = new Array(words_num - 1),
        byte_pos   = 0,
        byte_cnt = 0;
    while (byte_cnt < l)  {
        cnt        = (byte_cnt - (byte_cnt % 4)) / 4;
        byte_pos   = (byte_cnt % 4) * 8;
        words[cnt] = (words[cnt] | (str.charCodeAt(byte_cnt) << byte_pos));
        byte_cnt++;
    }
    cnt        = (byte_cnt-(byte_cnt % 4)) / 4;
    byte_pos   = (byte_cnt % 4) * 8;
    words[cnt] = words[cnt] | (0x80 << byte_pos);
    words[words_num - 2] = l << 3;
    words[words_num - 1] = l >>> 29;
    return words;
}

function wordToHex(lValue) {
    var hex_val = "", tmp = "", cnt;
    for (cnt = 0; cnt <= 3; cnt++) {
        tmp = "0" + ((lValue >>> (cnt * 8)) & 255).toString(16);
        hex_val = hex_val + tmp.substr(tmp.length - 2, 2);
    }
    return hex_val;
}

global.MD5 = function(str) {
    // Calculate the md5 hash of a string
    //
    // version: 905.3122
    // discuss at: http://phpjs.org/functions/md5
    // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // + namespaced by: Michael White (http://getsprink.com)
    // +    tweaked by: Jack
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // -    depends on: utf8_encode
    // *     example 1: md5('Kevin van Zonneveld');
    // *     returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'
    str = jpf.crypto.UTF8.encode(str);

    var x = convertToWordArray(str),
        a = 0x67452301,
        b = 0xEFCDAB89,
        c = 0x98BADCFE,
        d = 0x10325476,
        S11 = 7, S12 = 12, S13 = 17, S14 = 22,
        S21 = 5, S22 = 9 , S23 = 14, S24 = 20,
        S31 = 4, S32 = 11, S33 = 16, S34 = 23,
        S41 = 6, S42 = 10, S43 = 15, S44 = 21,
        AA, BB, CC, DD;

    for (var k = 0, l = x.length; k < l; k += 16) {
        AA = a;
        BB = b;
        CC = c;
        DD = d;
        a = _FF(a,b,c,d,x[k + 0], S11, 0xD76AA478);
        d = _FF(d,a,b,c,x[k + 1], S12, 0xE8C7B756);
        c = _FF(c,d,a,b,x[k + 2], S13, 0x242070DB);
        b = _FF(b,c,d,a,x[k + 3], S14, 0xC1BDCEEE);
        a = _FF(a,b,c,d,x[k + 4], S11, 0xF57C0FAF);
        d = _FF(d,a,b,c,x[k + 5], S12, 0x4787C62A);
        c = _FF(c,d,a,b,x[k + 6], S13, 0xA8304613);
        b = _FF(b,c,d,a,x[k + 7], S14, 0xFD469501);
        a = _FF(a,b,c,d,x[k + 8], S11, 0x698098D8);
        d = _FF(d,a,b,c,x[k + 9], S12, 0x8B44F7AF);
        c = _FF(c,d,a,b,x[k + 10],S13, 0xFFFF5BB1);
        b = _FF(b,c,d,a,x[k + 11],S14, 0x895CD7BE);
        a = _FF(a,b,c,d,x[k + 12],S11, 0x6B901122);
        d = _FF(d,a,b,c,x[k + 13],S12, 0xFD987193);
        c = _FF(c,d,a,b,x[k + 14],S13, 0xA679438E);
        b = _FF(b,c,d,a,x[k + 15],S14, 0x49B40821);
        a = _GG(a,b,c,d,x[k + 1], S21, 0xF61E2562);
        d = _GG(d,a,b,c,x[k + 6], S22, 0xC040B340);
        c = _GG(c,d,a,b,x[k + 11],S23, 0x265E5A51);
        b = _GG(b,c,d,a,x[k + 0], S24, 0xE9B6C7AA);
        a = _GG(a,b,c,d,x[k + 5], S21, 0xD62F105D);
        d = _GG(d,a,b,c,x[k + 10],S22, 0x2441453);
        c = _GG(c,d,a,b,x[k + 15],S23, 0xD8A1E681);
        b = _GG(b,c,d,a,x[k + 4], S24, 0xE7D3FBC8);
        a = _GG(a,b,c,d,x[k + 9], S21, 0x21E1CDE6);
        d = _GG(d,a,b,c,x[k + 14],S22, 0xC33707D6);
        c = _GG(c,d,a,b,x[k + 3], S23, 0xF4D50D87);
        b = _GG(b,c,d,a,x[k + 8], S24, 0x455A14ED);
        a = _GG(a,b,c,d,x[k + 13],S21, 0xA9E3E905);
        d = _GG(d,a,b,c,x[k + 2], S22, 0xFCEFA3F8);
        c = _GG(c,d,a,b,x[k + 7], S23, 0x676F02D9);
        b = _GG(b,c,d,a,x[k + 12],S24, 0x8D2A4C8A);
        a = _HH(a,b,c,d,x[k + 5], S31, 0xFFFA3942);
        d = _HH(d,a,b,c,x[k + 8], S32, 0x8771F681);
        c = _HH(c,d,a,b,x[k + 11],S33, 0x6D9D6122);
        b = _HH(b,c,d,a,x[k + 14],S34, 0xFDE5380C);
        a = _HH(a,b,c,d,x[k + 1], S31, 0xA4BEEA44);
        d = _HH(d,a,b,c,x[k + 4], S32, 0x4BDECFA9);
        c = _HH(c,d,a,b,x[k + 7], S33, 0xF6BB4B60);
        b = _HH(b,c,d,a,x[k + 10],S34, 0xBEBFBC70);
        a = _HH(a,b,c,d,x[k + 13],S31, 0x289B7EC6);
        d = _HH(d,a,b,c,x[k + 0], S32, 0xEAA127FA);
        c = _HH(c,d,a,b,x[k + 3], S33, 0xD4EF3085);
        b = _HH(b,c,d,a,x[k + 6], S34, 0x4881D05);
        a = _HH(a,b,c,d,x[k + 9], S31, 0xD9D4D039);
        d = _HH(d,a,b,c,x[k + 12],S32, 0xE6DB99E5);
        c = _HH(c,d,a,b,x[k + 15],S33, 0x1FA27CF8);
        b = _HH(b,c,d,a,x[k + 2], S34, 0xC4AC5665);
        a = _II(a,b,c,d,x[k + 0], S41, 0xF4292244);
        d = _II(d,a,b,c,x[k + 7], S42, 0x432AFF97);
        c = _II(c,d,a,b,x[k + 14],S43, 0xAB9423A7);
        b = _II(b,c,d,a,x[k + 5], S44, 0xFC93A039);
        a = _II(a,b,c,d,x[k + 12],S41, 0x655B59C3);
        d = _II(d,a,b,c,x[k + 3], S42, 0x8F0CCC92);
        c = _II(c,d,a,b,x[k + 10],S43, 0xFFEFF47D);
        b = _II(b,c,d,a,x[k + 1], S44, 0x85845DD1);
        a = _II(a,b,c,d,x[k + 8], S41, 0x6FA87E4F);
        d = _II(d,a,b,c,x[k + 15],S42, 0xFE2CE6E0);
        c = _II(c,d,a,b,x[k + 6], S43, 0xA3014314);
        b = _II(b,c,d,a,x[k + 13],S44, 0x4E0811A1);
        a = _II(a,b,c,d,x[k + 4], S41, 0xF7537E82);
        d = _II(d,a,b,c,x[k + 11],S42, 0xBD3AF235);
        c = _II(c,d,a,b,x[k + 2], S43, 0x2AD7D2BB);
        b = _II(b,c,d,a,x[k + 9], S44, 0xEB86D391);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }

    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
};

})(jpf.crypto);

//#endif
