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

// #ifdef __WITH_HTML_CLEANER
/**
 * The parser of the HyperText Markup Language.
 * @private
 */
apf.htmlCleaner = (function() {
    var prepareRE    = null, exportRE = null,
        noMarginTags = {"table": 1, "TABLE": 1},
        selfClosing  = {"br": 1, "img": 1, "input": 1, "hr": 1};

    return {
        /**
         * Processes, sanitizes and cleanses a string of raw html that originates
         * from outside a contentEditable area, so that the inner workings of the
         * editor are less likely to be affected.
         *
         * @param  {String} html
         * @return The sanitized string, valid to store and use in the editor
         * @type   {String}
         */
        prepare: function(html, bNoEnclosing) {
            if (!prepareRE) {
                // compile 'em regezz
                prepareRE = [
                    /<(\/?)strong>|<strong( [^>]+)>/gi,
                    /<(\/?)em>|<em( [^>]+)>/gi,
                    /&apos;/g,
                    /*
                        Ruben: due to a bug in IE and FF this regexp won't fly:
                        /((?:[^<]*|<(?:span|strong|em|u|i|b)[^<]*))<br[^>]*?>/gi, //@todo Ruben: add here more inline html tag names
                    */
                    /(<(\/?)(span|strong|em|u|i|b|a|strike|sup|sub|font|img)(?:\s+[\s\S]*?)?>)|(<br[\s\S]*?>)|(<(\/?)([\w\-]+)(?:\s+[\s\S]*?)?>)|([^<>]*)/gi, //expensive work around
                    /(<a[^>]*href=)([^\s^>]+)*([^>]*>)/gi,
                    /<p><\/p>/gi,
                    /<a( )([^>]+)\/>|<a\/>/gi
                ];
            }

            // Convert strong and em to b and i in FF since it can't handle them
            if (apf.isGecko) {//@todo what about the other browsers?
                html = html.replace(prepareRE[0], "<$1b$2>")
                           .replace(prepareRE[1], "<$1i$2>");
            }
            else if (apf.isIE) {
                html = html.replace(prepareRE[2], "&#39;") // IE can't handle apos
                           .replace(prepareRE[4], "$1$2 _apf_href=$2$3");
                           //.replace(prepareRE[5], "<p>&nbsp;</p>");

                // <BR>'s need to be replaced to be properly handled as
                // block elements by IE - because they're not converted
                // when an editor command is executed
                var str = [], capture = false, strP = [], depth = [], bdepth = [],
                    lastBlockClosed = false;
                html.replace(prepareRE[3],
                  function(m, inline, close, tag, br, block, bclose, btag, any){
                    if (inline) {
                        var id = strP.push(inline);

                        tag = tag.toLowerCase();
                        if (!selfClosing[tag]) {
                            if (close) {
                                if (!depth[depth.length-1]
                                  || depth[depth.length-1][0] != tag) {
                                    strP.length--; //ignore non matching tag
                                }
                                else {
                                    depth.length--;
                                }
                            }
                            else {
                                depth.push([tag, id]);
                            }
                        }

                        capture = true;
                    }
                    else if (any) {
                        strP.push(any);
                        capture = true;
                    }
                    else if (br) {
                        if (capture) {
                            if (depth.length) {
                                strP.push(br);
                            }
                            else {
                                str.push("<p>", strP.join(""), "</p>");
                                strP = [];
                            }

                            if (!depth.length)
                                capture = false;
                        }
                        else {
                            if ((bdepth.length || lastBlockClosed)
                              && br.indexOf("_apf_marker") > -1) {
                                //donothing
                            }
                            else
                                str.push("<p>&nbsp;</p>");
                        }
                    }
                    else if (block){
                        if (bclose) {
                            if (bdepth[bdepth.length-1] != btag.toLowerCase()) {
                                return;
                            }
                            else {
                                bdepth.length--;
                            }

                            //Never put P's inside block elements
                            if (strP.length) {
                                str.push(strP.join(""));
                                strP = [];
                            }

                            lastBlockClosed = 2;
                        }
                        else {
                            var useStrP = strP.length && strP.join("").trim();
                            var last = useStrP ? strP : str;
                            if (!noMarginTags[btag]) {
                                if (last[last.length - 1] == "<p>&nbsp;</p>")
                                    last[last.length - 1] = "";//<p></p>"; //maybe make this a setting
                                else if(useStrP && !bdepth.length)
                                    last.push("<p></p>");
                            }

                            if (strP.length) {
                                //Never put P's inside block elements
                                if (!useStrP || bdepth.length) {
                                    str.push(strP.join(""));
                                    strP = [];
                                }
                                else {
                                    str.push("<p>", strP.join(""), "</p>");
                                    strP = [];
                                }
                            }

                            bdepth.push(btag.toLowerCase());
                        }

                        str.push(block);
                        capture = false;
                    }

                    lastBlockClosed = lastBlockClosed == 2 ? 1 : false;
                  });
                var s;
                if ((s = strP.join("")).trim())
                    str.push(bNoEnclosing
                     ? s
                     : "<p>" + s + "</p>");
                html = str.join("");
            }

            // Fix some issues
            html = (apf.xmlentities ? apf.xmlentities(html) : html)
                       .replace(prepareRE[6], "<a$1$2></a>");

            return html;
        },

        /**
         * Return a string of html, but then formatted in such a way that it can
         * embedded.
         *
         * @param  {String}  html
         * @param  {Boolean} noEntities
         * @type   {String}
         */
        parse: function(html, noEntities, noParagraph) {
            if (!exportRE) {
                // compile 'em regezz
                exportRE = [
                    /<br[^>]*><\/li>/gi,
                    /<br[^>]*_apf_placeholder="1"\/?>/gi,
                    /<(a|span|div|h1|h2|h3|h4|h5|h6|pre|address)>[\s\n\r\t]*<\/(a|span|div|h1|h2|h3|h4|h5|h6|pre|address)>/gi,
                    /<(tr|td)>[\s\n\r\t]*<\/(tr|td)>/gi,
                    /[\s]*_apf_href="?[^\s^>]+"?/gi,
                    /(".*?"|'.*?')|(\w)=([^'"\s>]+)/gi,
                    /<((?:br|input|hr|img)(?:[^>]*[^\/]|))>/ig, // NO! do <br /> see selfClosing
                    /<p>&nbsp;$/mig,
                    /(<br[^>]*?>(?:[\r\n\s]|&nbsp;)*<br[^>]*?>)|(<(\/?)(span|strong|em|u|i|b|a|br|strike|sup|sub|font|img)(?:\s+.*?)?>)|(<(\/?)([\w\-]+)(?:\s+.*?)?>)|([^<>]*)/gi,
                    /<\/p>/gi, //<p>&nbsp;<\/p>|
                    /<p>/gi,
                    /<\s*\/?\s*(?:\w+:\s*)?[\w-]*[\s>\/]/g
                ];
            }

            if (apf.isIE) {
                html = html.replace(exportRE[7], "<p></p>")
                           .replace(exportRE[9], "<br />")
                           .replace(exportRE[10], "")
            }
            else if (html == "<br>")
                html = "";

            html = (!noEntities && apf.xmlentities ? apf.xmlentities(html) : html)
                       .replace(exportRE[0], "</li>")
                       .replace(exportRE[1], "")
                       .replace(exportRE[2], "")
                       .replace(exportRE[3], "<$1>&nbsp;</$2>")
                       .replace(exportRE[4], "")
                       .replace(exportRE[6], "<$1 />")
                       .replace(exportRE[11], function(m){
                           return m.toLowerCase();
                       });

            //@todo: Ruben: Maybe make this a setting (paragraphs="true")
            //@todo might be able to unify this function with the one above.
            if (apf.isIE && !noParagraph) {
                var str = [], capture = true, strP = [], depth = [], bdepth = [];
                html.replace(exportRE[8],
                  function(m, br, inline, close, tag, block, bclose, btag, any){
                    if (inline) {
                        if (apf.isIE) {
                            inline = inline.replace(exportRE[5],
                                function(m1, str, m2, v){
                                    return str || m2 + "=\"" + v + "\"";
                                });//'$2="$3"') //quote un-quoted attributes
                        }

                        var id = strP.push(inline);

                        if (!selfClosing[tag]) {
                            if (close) {
                                if (!depth[depth.length-1]
                                  || depth[depth.length-1][0] != tag) {
                                    strP.length--; //ignore non matching tag
                                }
                                else {
                                    depth.length--;
                                }
                            }
                            else {
                                depth.push([tag, id]);
                            }
                        }

                        capture = true;
                    }
                    else if (any) {
                        strP.push(any);
                        capture = true;
                    }
                    else if (br) {
                        if (capture) {
                            if (depth.length) {
                                strP.push(br);
                            }
                            else {
                                str.push("<p>", strP.join("").trim()
                                    || "&nbsp;", "</p>");
                                strP    = [];
                                capture = false;
                            }
                        }
                        else
                            str.push("<p>&nbsp;</p>");
                    }
                    else if (block){
                        if (bclose) {
                            if (bdepth[bdepth.length-1] != btag) {
                                return;
                            }
                            else {
                                bdepth.length--;
                            }

                            //Never put P's inside block elements
                            if (strP.length) {
                                str.push(strP.join(""));
                                strP = [];
                            }
                        }
                        else {
                            if (apf.isIE) {
                                block = block.replace(exportRE[5],
                                    function(m1, str, m2, v){
                                        return str || m2 + "=\"" + v + "\"";
                                    });//'$2="$3"') //quote un-quoted attributes
                            }

                            //@todo this section can be make similar to the one
                            //      in the above function and vice verse
                            var last = strP.length ? strP : str;
                            if (last[last.length - 1] == "<p>&nbsp;</p>")
                                last.length--;

                            if (strP.length) {
                                var s;
                                //Never put P's inside block elements
                                if (bdepth.length || (s = strP.join("").trim())
                                  .replace(/<.*?>/g,"").trim() == "") {
                                    str.push(s || strP.join(""));
                                    strP = [];
                                }
                                else {
                                    str.push("<p>",
                                        (s || strP.join("").trim() || "&nbsp;")
                                            .replace(/<br \/>[\s\r\n]*$/, ""),
                                        "</p>");
                                    strP = [];
                                }
                            }

                            bdepth.push(btag);
                        }

                        str.push(block);
                        capture = false;
                    }
                  });

                if (strP.length) {
                    str.push("<p>" + strP.join("")
                        .replace(/<br \/>[\s\r\n]*$/, "") + "</p>");
                }
                html = str.join("");
            }
            else {
                html = html.replace(/<br[^>]*_apf_marker="1"[^>]*>/gi, "<br />");
            }

            // #ifdef __DEBUG
            // check for VALID XHTML in DEBUG mode...
            try {
                apf.getXml("<source>" + html.replace(/&.{3,5};/g, "")
                    + "</source>");
            }
            catch(ex) {
                apf.console.error(ex.message + "\n" + html.escapeHTML());
            }
            // #endif

            return html;
        }
    };
})();

// #endif
