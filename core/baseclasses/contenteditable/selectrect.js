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

//#ifdef __WITH_CONTENTEDITABLE
/**
 * @private
 */
apf.selectrect = function (){
    var active;
    var p1    = document.body.appendChild(document.createElement("div")),
        p2    = document.body.appendChild(document.createElement("div")),
        q     = document.body.appendChild(document.createElement("div")),
        _self = this,
        startX, startY;
    p1.className = "pointer_left";
    p2.className = "pointer_right";
    q.className  = "new_element";

    this.activate = function(){
        if (active) return;
        active = true;
        
        document.onmousemove = function(e){
            if (!e) e = event;

            p1.style.width  = (Math.abs(e.clientX) || 1) + "px";
            p1.style.height = (Math.abs(e.clientY) || 1) + "px";

            p2.style.width  = (Math.abs(document.documentElement.offsetWidth
                - e.clientX - 5) || 1) + "px";
            p2.style.height = (Math.abs(document.documentElement.offsetHeight
                - e.clientY - 5) || 1) + "px";

            if (q.style.display == "block"){
                var wt = e.clientX - startX - 1,
                    ht = e.clientY - startY - 1,
                    min = Math.min(wt, ht);
                //if (e.shiftKey)
                    //wt = ht = min;

                q.style.width  = (wt < 0 ? -1 * (wt - 1) : (wt || 1)) + "px";
                q.style.height = (ht < 0 ? -1 * (ht - 1) : (ht || 1)) + "px";

                q.style.left  = wt < 0 ? "" : (startX) + "px";
                q.style.right = wt < 0 
                    ? (document.documentElement.offsetWidth - startX - 4) + "px"
                    : "";

                q.style.bottom = ht < 0 
                    ? (document.documentElement.offsetHeight - startY - 4) + "px"
                    : "";
                q.style.top    = ht < 0 ? "" : (startY) + "px";
                
                apf.config.setProperty("x", apf.getHtmlLeft(q));
                apf.config.setProperty("y", apf.getHtmlTop(q));
                apf.config.setProperty("w", q.offsetWidth);
                apf.config.setProperty("h", q.offsetHeight);
            }
            else {
                apf.config.setProperty("x", e.clientX);
                apf.config.setProperty("y", e.clientY);
                apf.config.setProperty("w", "");
                apf.config.setProperty("h", "");
            }
        }

        document.onmousedown = function(e){
            if (!e) e = event;
            //if ((e.srcElement || e.target) == document.body)
                //return false;

            p1.style.top = "-2000px";
            p2.style.top = "-2000px";
            var el = document.elementFromPoint(e.clientX, e.clientY);
            var amlNode = apf.findHost(el);
            
            p1.style.top = "";
            p2.style.top = "";
            
            if (amlNode) {
                while (amlNode && !amlNode.$int)
                    amlNode = amlNode.parentNode;
            }
            if (!amlNode)
                amlNode = apf.document.documentElement;
            
            if (!amlNode.editable)
                return;
              
            //apf.ContentEditable.resize.grab(amlNode);

            q.style.display = "block";
            q.style.left    = (startX = event.clientX) + "px";
            q.style.top     = (startY = event.clientY) + "px";
            q.style.width   = q.style.height = "1px";
            
            apf.dragMode = true;
        };

        document.onmouseup = function(){
            if (q.offsetWidth > 10 && q.offsetHeight > 10) {
                if (apf.document.queryCommandValue("mode") == "select") {
                    apf.document.execCommand("select", false, {htmlNode: q});
                }
                else {
                    apf.document.execCommand("add", false, {htmlNode: q});
                }
                _self.deactivate();
            }
            
            q.style.display = "none";
            startX = false;
            startY = false;
            
            apf.dragMode = false;
        };

        p1.style.display =
        p2.style.display = "block";
        document.body.style.cursor =
        document.documentElement.style.cursor = "crosshair";
    };

    this.deactivate = function(){
        active = false;
        document.onmousemove = null;
        document.onmousedown = null;
        document.onmouseup = null;

        p1.style.display =
        p2.style.display = 
        q.style.display  = "none";
        document.body.style.cursor =
        document.documentElement.style.cursor = "";
    };
};
//#endif