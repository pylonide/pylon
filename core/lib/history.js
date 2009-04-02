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

// #ifdef __WITH_BACKBUTTON

/**
 * Implementation of hash change listener. The 'hash' is the part of the
 * location string in your browser that takes care of pointing to a section
 * within the current application.
 * Example:
 * <pre class="code">
 *  http://www.example.com/index.php#products
 * </pre>
 * Remarks:
 * In future browsers (2008) the location hash can be set by script and the
 * {@link element.history.event.hashchange} event is called when it's changed by using the back or forward
 * button of the browsers. In the current (2008) browsers this is not the case.
 * This object handles that logic for those browsers in such a way that the user
 * of the application can use the back and forward buttons in an intuitive manner.
 *
 * @event hashchange Fires when the hash changes. This can be either by setting
 * a new hash value or when a user uses the back or forward button. Typing a
 * new hash value in the location bar will also trigger this function.
 * Example:
 * <pre class="code">
 *  jpf.addEventListener("hashchange", function(e){
 *      var info = e.page.split(":");
 *
 *      switch(info[0]) {
 *          case "product": //hash is for instance 'product:23849'
 *              //Sets the state to displaying product information see {@link element.state}
 *              stProduct.activate(); 
 *              //Loads a product by id
 *              loadProduct(info[1]); 
 *              break;
 *          case "news":
 *              stNews.activate();
 *              break;
 *      }
 *  });
 * </pre>
 *
 * @default_private
 */
jpf.history = {
    inited: false,
    page  : null,

    init  : function(name){
        this.inited = true;
        this.hasChanged(name);

        if (jpf.isIE) {
            var str =
                "<style>\
                    BODY, HTML{margin : 0;}\
                    h1{height : 100px;margin : 0;padding : 0;}\
                </style>\
                <body>\
                    <h1 id='" + name + "'>0</h1>\
                </body>\
                <script>\
                    var lastURL = -1;\
                    if(document.all){\
                    document.body.onscroll = checkUrl;\
                }else{\
                    setInterval('checkUrl()', 200);\
                }\
                function checkUrl(){\
                    var nr=Math.round((document.all ? document.body : document.documentElement).scrollTop/100);\
                    top.jpf.history.hasChanged(document.getElementsByTagName('h1')[nr].id);\
                    lastURL = document.body.scrollTop;\
                }\
                checkUrl();\
                </script>";

            if (top == self) {
                document.body.insertAdjacentHTML("beforeend",
                    "<iframe name='nav' style2='position:absolute;left:10px;top:10px;height:100px;width:100px;z-index:1000'\
                       style='width:1px;height:1px;' src='about:blank'></iframe>");
                document.frames["nav"].document.open();
                document.frames["nav"].document.write(str);
                document.frames["nav"].document.close();
            }

            this.iframe = document.frames["nav"];// : document.getElementById("nav").contentWindow;
            //Check to see if url has been manually changed
            this.timer2 = setInterval(function(){
                //status = jpf.history.changingHash;
                if (!jpf.history.changingHash && location.hash != "#" + jpf.history.page) {
                    jpf.history.hasChanged(location.hash.replace(/^#/, ""));
                }
            }, jpf.history.delay || 200);
        }
        else {
            jpf.history.lastUrl = location.href;
            this.timer2 = setInterval(function(){
                if (jpf.history.lastUrl == location.href)
                    return;

                jpf.history.lastUrl = location.href;
                //var page            = location.href.replace(/^.*#(.*)$/, "$1")
                var page = location.hash.replace("#", "");//.replace(/^.*#(.*)$/,"$1");
                jpf.history.hasChanged(decodeURI(page));
            }, 20);
        }
    },

    /**
     * Sets the hash value of the location bar in the browser. This is used
     * to represent the state of the application for use by the back and forward
     * buttons as well as for use when bookmarking or sharing url's.
     * @param {String}  name    the new hash value.
     * @param {Boolean} timed   whether to add a delay to setting the value.
     */
    to_name : null,
    setHash : function(name, timed){
        if (this.changing || this.page == name || location.hash == "#" + name) {
            this.to_name = name;
            return;
        }

        if (jpf.isIE && !timed) {
            this.to_name = name;
            return setTimeout(function(){jpf.history.setHash(jpf.history.to_name, true);}, 200);
        }

        this.changePage(name);
        if (!this.inited)
            return this.init(name);

        this.changePage(name);
        if (!this.inited)
            return this.init(name);

        if (jpf.isIE) {
            var h       = this.iframe.document.body
                .appendChild(this.iframe.document.createElement('h1'));
            h.id        = name;
            h.innerHTML = this.length;
        };

        (jpf.isIE ? this.iframe : window).location.href = "#" + name;

        if (!jpf.isIE)
            jpf.history.lastUrl = location.href;
    },

    timer : null,
    changePage: function(page){
        if (jpf.isIE) {
            this.page = page;
            this.changingHash = true;
            clearTimeout(this.timer);
            this.timer = setTimeout(function(){
                location.hash = page;
                jpf.history.changingHash = false;
            }, 1);
        }
    },

    hasChanged: function(page){
        if (page == this.page) return;
        this.changePage(page);

        this.changing = true;
        jpf.dispatchEvent("hashchange", {page: page});
        this.changing = false;
    }
};

// #endif
