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

jpf.History = {
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
                      top.jpf.History.hasChanged(document.getElementsByTagName('h1')[nr].id);\
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
            this.timer = setInterval(function(){
                //status = jpf.History.changingHash;
                if (!jpf.History.changingHash && location.hash != "#" + jpf.History.page) {
                    jpf.History.hasChanged(location.hash.replace(/^#/, ""));
                }
            }, 200);
        }
        else {
            jpf.History.lastUrl = location.href;
            this.timer = setInterval(function(){
                if (jpf.History.lastUrl == location.href) 
                    return;
                
                jpf.History.lastUrl = location.href;
                var page            = location.href.replace(/^.*#(.*)$/, "$1")
                jpf.History.hasChanged(decodeURI(page));
            }, 20);
        }
    },
    
    addPoint: function(name, timed){
        if (this.changing || this.page == name || location.hash == "#" + name) 
            return;
        
        if (jpf.isIE && !timed)
            return setTimeout(function(){jpf.History.addPoint(name, true);}, 200);
        
        this.changePage(name);
        if (!this.inited)
            return this.init(name);
        
        this.changePage(name);
        if (!this.inited) 
            return this.init(name);
        
        if (jpf.isIE) {
            //var h = (jpf.isIE ? this.iframe.document:document).body.appendChild((jpf.isIE ? this.iframe.document:document).createElement('span'));
            var h       = this.iframe.document.body.appendChild(this.iframe.document.createElement('h1'));
            h.id        = name;
            h.innerHTML = this.length;
        };
        
        (jpf.isIE ? this.iframe : window).location.href = "#" + name;
        
        if (!jpf.isIE) 
            History.lastUrl = location.href;
    },
    
    timer : null,
    changePage: function(page){
        if (jpf.isIE) {
            this.page = page;
            this.changingHash = true;
            clearTimeout(this.timer);
            this.timer = setTimeout(function(){
                location.hash = page;
                jpf.History.changingHash = false;
            }, 1);
        }
    },
    
    hasChanged: function(page){
        if (page == this.page) return;
        this.changePage(page);
        
        this.changing = true;
        if (this.onchange)
            this.onchange(page);
        this.changing = false;
    }
}

// #endif
