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

//#ifdef __WITH_COLORS

apf.color = {
/*
    colors: {
        aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",
        aquamarine:"#7fffd4",azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",
        black:"#000000",blanchedalmond:"#ffebcd",blue:"#0000ff",
        blueviolet:"#8a2be2",brown:"#a52a2a",burlywood:"#deb887",
        cadetblue:"#5f9ea0",chartreuse:"#7fff00",chocolate:"#d2691e",
        coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",
        crimson:"#dc143c",cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",
        darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",darkgrey:"#a9a9a9",
        darkgreen:"#006400",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",
        darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",
        darkred:"#8b0000",darksalmon:"#e9967a",darkseagreen:"#8fbc8f",
        darkslateblue:"#483d8b",darkslategray:"#2f4f4f",
        darkslategrey:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",
        deeppink:"#ff1493",deepskyblue:"#00bfff",dimgray:"#696969",
        dimgrey:"#696969",dodgerblue:"#1e90ff",firebrick:"#b22222",
        floralwhite:"#fffaf0",forestgreen:"#228b22",fuchsia:"#ff00ff",
        gainsboro:"#dcdcdc",ghostwhite:"#f8f8ff",gold:"#ffd700",
        goldenrod:"#daa520",gray:"#808080",grey:"#808080",green:"#008000",
        greenyellow:"#adff2f",honeydew:"#f0fff0",hotpink:"#ff69b4",
        indianred:"#cd5c5c",indigo:"#4b0082",ivory:"#fffff0",khaki:"#f0e68c",
        lavender:"#e6e6fa",lavenderblush:"#fff0f5",lawngreen:"#7cfc00",
        lemonchiffon:"#fffacd",lightblue:"#add8e6",lightcoral:"#f08080",
        lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",lightgray:"#d3d3d3",
        lightgrey:"#d3d3d3",lightgreen:"#90ee90",lightpink:"#ffb6c1",
        lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",lightskyblue:"#87cefa",
        lightslategray:"#778899",lightslategrey:"#778899",
        lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",
        limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",
        mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",
        mediumorchid:"#ba55d3",mediumpurple:"#9370d8",mediumseagreen:"#3cb371",
        mediumslateblue:"#7b68ee",mediumspringgreen:"#00fa9a",
        mediumturquoise:"#48d1cc",mediumvioletred:"#c71585",
        midnightblue:"#191970",mintcream:"#f5fffa",mistyrose:"#ffe4e1",
        moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",
        oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",
        orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",
        palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#d87093",
        papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",
        plum:"#dda0dd",powderblue:"#b0e0e6",purple:"#800080",red:"#ff0000",
        rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",
        salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",
        seashell:"#fff5ee",sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",
        slateblue:"#6a5acd",slategray:"#708090",slategrey:"#708090",
        snow:"#fffafa",springgreen:"#00ff7f",steelblue:"#4682b4",tan:"#d2b48c",
        teal:"#008080",thistle:"#d8bfd8",tomato:"#ff6347",turquoise:"#40e0d0",
        violet:"#ee82ee",wheat:"#f5deb3",white:"#ffffff",whitesmoke:"#f5f5f5",
        yellow:"#ffff00",yellowgreen:"#9acd32"
    },*/
    colorshex: {
        aliceblue:0xf0f8ff,antiquewhite:0xfaebd7,aqua:0x00ffff,
        aquamarine:0x7fffd4,azure:0xf0ffff,beige:0xf5f5dc,bisque:0xffe4c4,
        black:0x000000,blanchedalmond:0xffebcd,blue:0x0000ff,
        blueviolet:0x8a2be2,brown:0xa52a2a,burlywood:0xdeb887,
        cadetblue:0x5f9ea0,chartreuse:0x7fff00,chocolate:0xd2691e,
        coral:0xff7f50,cornflowerblue:0x6495ed,cornsilk:0xfff8dc,
        crimson:0xdc143c,cyan:0x00ffff,darkblue:0x00008b,darkcyan:0x008b8b,
        darkgoldenrod:0xb8860b,darkgray:0xa9a9a9,darkgrey:0xa9a9a9,
        darkgreen:0x006400,darkkhaki:0xbdb76b,darkmagenta:0x8b008b,
        darkolivegreen:0x556b2f,darkorange:0xff8c00,darkorchid:0x9932cc,
        darkred:0x8b0000,darksalmon:0xe9967a,darkseagreen:0x8fbc8f,
        darkslateblue:0x483d8b,darkslategray:0x2f4f4f,
        darkslategrey:0x2f4f4f,darkturquoise:0x00ced1,darkviolet:0x9400d3,
        deeppink:0xff1493,deepskyblue:0x00bfff,dimgray:0x696969,
        dimgrey:0x696969,dodgerblue:0x1e90ff,firebrick:0xb22222,
        floralwhite:0xfffaf0,forestgreen:0x228b22,fuchsia:0xff00ff,
        gainsboro:0xdcdcdc,ghostwhite:0xf8f8ff,gold:0xffd700,
        goldenrod:0xdaa520,gray:0x808080,grey:0x808080,green:0x008000,
        greenyellow:0xadff2f,honeydew:0xf0fff0,hotpink:0xff69b4,
        indianred:0xcd5c5c,indigo:0x4b0082,ivory:0xfffff0,khaki:0xf0e68c,
        lavender:0xe6e6fa,lavenderblush:0xfff0f5,lawngreen:0x7cfc00,
        lemonchiffon:0xfffacd,lightblue:0xadd8e6,lightcoral:0xf08080,
        lightcyan:0xe0ffff,lightgoldenrodyellow:0xfafad2,lightgray:0xd3d3d3,
        lightgrey:0xd3d3d3,lightgreen:0x90ee90,lightpink:0xffb6c1,
        lightsalmon:0xffa07a,lightseagreen:0x20b2aa,lightskyblue:0x87cefa,
        lightslategray:0x778899,lightslategrey:0x778899,
        lightsteelblue:0xb0c4de,lightyellow:0xffffe0,lime:0x00ff00,
        limegreen:0x32cd32,linen:0xfaf0e6,magenta:0xff00ff,maroon:0x800000,
        mediumaquamarine:0x66cdaa,mediumblue:0x0000cd,
        mediumorchid:0xba55d3,mediumpurple:0x9370d8,mediumseagreen:0x3cb371,
        mediumslateblue:0x7b68ee,mediumspringgreen:0x00fa9a,
        mediumturquoise:0x48d1cc,mediumvioletred:0xc71585,
        midnightblue:0x191970,mintcream:0xf5fffa,mistyrose:0xffe4e1,
        moccasin:0xffe4b5,navajowhite:0xffdead,navy:0x000080,
        oldlace:0xfdf5e6,olive:0x808000,olivedrab:0x6b8e23,orange:0xffa500,
        orangered:0xff4500,orchid:0xda70d6,palegoldenrod:0xeee8aa,
        palegreen:0x98fb98,paleturquoise:0xafeeee,palevioletred:0xd87093,
        papayawhip:0xffefd5,peachpuff:0xffdab9,peru:0xcd853f,pink:0xffc0cb,
        plum:0xdda0dd,powderblue:0xb0e0e6,purple:0x800080,red:0xff0000,
        rosybrown:0xbc8f8f,royalblue:0x4169e1,saddlebrown:0x8b4513,
        salmon:0xfa8072,sandybrown:0xf4a460,seagreen:0x2e8b57,
        seashell:0xfff5ee,sienna:0xa0522d,silver:0xc0c0c0,skyblue:0x87ceeb,
        slateblue:0x6a5acd,slategray:0x708090,slategrey:0x708090,
        snow:0xfffafa,springgreen:0x00ff7f,steelblue:0x4682b4,tan:0xd2b48c,
        teal:0x008080,thistle:0xd8bfd8,tomato:0xff6347,turquoise:0x40e0d0,
        violet:0xee82ee,wheat:0xf5deb3,white:0xffffff,whitesmoke:0xf5f5f5,
        yellow:0xffff00,yellowgreen:0x9acd32
    },
    fixHSB: function (hsb) {
        return {
            h: Math.min(360, Math.max(0, hsb.h)),
            s: Math.min(100, Math.max(0, hsb.s)),
            b: Math.min(100, Math.max(0, hsb.b))
        };
    },

    fixRGB: function (rgb) {
        return {
            r: Math.min(255, Math.max(0, rgb.r)),
            g: Math.min(255, Math.max(0, rgb.g)),
            b: Math.min(255, Math.max(0, rgb.b))
        };
    },

    fixHex: function (hex) {
        var len = 6 - hex.length;
        if (len > 0) {
            var o = [], i = 0;
            for (; i < len; i++)
                o.push("0");
            o.push(hex);
            hex = o.join("");
        }
        return hex;
    },
    
    hexToRGB: function (hex) {
        hex = parseInt(((hex.indexOf("#") > -1) ? hex.substring(1) : hex), 16);
        return {r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF)};
    },

    hexToHSB: function (hex) {
        return this.RGBToHSB(this.hexToRGB(hex));
    },

    RGBToHSB: function (rgb) {
        var hsb = {
            h: 0,
            s: 0,
            b: 0
        };
        var min   = Math.min(rgb.r, rgb.g, rgb.b),
            max   = Math.max(rgb.r, rgb.g, rgb.b),
            delta = max - min;
        hsb.b = max;
        if (max != 0) { }
        hsb.s = max != 0 ? 255 * delta / max : 0;
        if (hsb.s != 0) {
            if (rgb.r == max)
                hsb.h = (rgb.g - rgb.b) / delta;
            else if (rgb.g == max)
                hsb.h = 2 + (rgb.b - rgb.r) / delta;
            else
                hsb.h = 4 + (rgb.r - rgb.g) / delta;
        }
        else
            hsb.h = -1;
        hsb.h *= 60;
        if (hsb.h < 0)
            hsb.h += 360;
        hsb.s *= 100/255;
        hsb.b *= 100/255;
        return hsb;
    },
    
    HSBToRGB: function(hsb) {
        var rgb = {},
            h   = Math.round(hsb.h),
            s   = Math.round(hsb.s * 255 / 100),
            v   = Math.round(hsb.b * 255 / 100);
        if (s == 0)
            rgb.r = rgb.g = rgb.b = v;
        else {
            var t1 = v,
                t2 = (255 - s) * v / 255,
                t3 = (t1 - t2) * (h % 60)/60;
            if (h == 360)
                h = 0;
            if (h < 60)
                rgb.r = t1, rgb.b = t2, rgb.g = t2 + t3;
            else if (h < 120)
                rgb.g = t1, rgb.b = t2, rgb.r = t1 - t3;
            else if (h < 180)
                rgb.g = t1, rgb.r = t2, rgb.b = t2 + t3;
            else if (h < 240)
                rgb.b = t1, rgb.r = t2, rgb.g = t1 - t3;
            else if (h < 300)
                rgb.b = t1, rgb.g = t2, rgb.r = t2 + t3;
            else if (h < 360)
                rgb.r = t1, rgb.g = t2, rgb.b = t1 - t3;
            else
                rgb.r = 0, rgb.g = 0, rgb.b = 0;
        }
        return {r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b)};
    },

    RGBToHex: function(rgb) {
        return ('00000'+(rgb.r<<16 | rgb.g<<8 | rgb.b).toString(16)).slice(-6);
    },

    HSBToHex: function(hsb) {
        return this.RGBToHex(this.HSBToRGB(hsb));
    }
};

//#endif
