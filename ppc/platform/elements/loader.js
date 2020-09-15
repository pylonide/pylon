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

// #ifdef __AMLLOADER || __INC_ALL

/**
 * @todo description
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
ppc.loader = function(){
    this.$init("loader", ppc.NODE_HIDDEN);
    
    this.show = function(){
        this.$ext.style.display = "block";
    }
    
    this.hide = function(){
        this.$ext.style.display = "none";
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var pHtmlNode;
        if (!(pHtmlNode = this.parentNode.$int)) 
            return;

        this.$ext = ppc.insertHtmlNode(null, pHtmlNode, null, (this.$aml 
            ? (this.$aml.serialize ? this.$aml.serialize() : this.$aml.xml)
            : this.serialize()).replace(/^<[^>]*>\s*|\s*<[^>]*>$/g, ""));
        
        if (!ppc.loaded) {
            var _self = this;
            if(ppc.config.loaderAnimIndicator)
                _self.animateLoader(10);
            ppc.addEventListener("load", function(){
                if (ppc.isTrue(ppc.config.autoHideLoading)) {
                    ppc.queue.empty();
                    _self.hide();
                }
                else {
                    if(ppc.config.loaderAnimIndicator)
                        _self.animateLoader(20);
                }
            });
        }
    });
    
    this.lastLoaderStep = 0;
    
    /*
     * Animates a loader indiacator
     * 
     * the step is in the % of the total width of the indicator
     *
     */
    this.animateLoader = function(step){      
        var _self    = this,
            loaderEl = document.getElementById(ppc.config.loaderAnimIndicator);
        if(!loaderEl)
            return;
            
        step = ppc.config.loaderWidth * (step/100);

        var fromStep = this.lastLoaderStep,
            toStep   = this.lastLoaderStep + step;
        
        this.lastLoaderStep = toStep;

        if(toStep > ppc.config.loaderWidth)
            toStep = ppc.config.loaderWidth;

        ppc.tween.single(document.getElementById('animatedLoader'), {
            steps    : 5,
            anim     : ppc.tween.EASEOUT,
            type     : "width",
            from     : fromStep,
            to       : toStep,
            onfinish : function() {
                if(toStep >= ppc.config.loaderWidth) {
                    ppc.queue.empty();
                    _self.hide();
                }
            }
        });
    };
};

ppc.loader.prototype = new ppc.AmlElement();

ppc.aml.setElement("loader", ppc.loader);

// #endif
