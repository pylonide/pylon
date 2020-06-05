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

// #ifdef __WITH_CONFIG || __INC_ALL

/**
 * @todo description
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */

// #ifdef __AMLPORTAL
ppc.body = function(){
    this.$init("body", ppc.NODE_VISIBLE);
};
// #endif

ppc.AmlConfig = function(){
    this.$init("config", ppc.NODE_VISIBLE);
};

(function(){
    this.focussable = false;
    this.$canLeechSkin = true;
    
    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$int = this.$getExternal(this.$isLeechingSkin
            ? this.localName 
            : "main");
    };
// #ifdef __AMLPORTAL
}).call(ppc.body.prototype = new ppc.Presentation());
ppc.AmlConfig.prototype = ppc.body.prototype;
ppc.aml.setElement("body", ppc.body);
/* #else
}).call(ppc.AmlConfig.prototype = new ppc.Presentation());
#endif*/
ppc.aml.setElement("config", ppc.AmlConfig);
// #endif
