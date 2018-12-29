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

// #ifdef __WITH_AMLCHARACTERDATA
//@todo apf3.0 The functions seem to not set nodeValue...
apf.AmlCharacterData = function(){
    this.data = "";
    this.length = 0;
    
    this.$init(true);
    
    this.appendData = function(sValue){
        this.dispatchEvent("DOMCharacterDataModified", {
            value : sValue
        });
    };
    
    this.deleteData = function(nOffset, nCount){
        this.dispatchEvent("DOMCharacterDataModified", {
            offset: nOffset,
            count : nCount
        });
    };
    
    this.insertData = function(nOffset, nCount){
        this.dispatchEvent("DOMCharacterDataModified", {
            offset: nOffset,
            count : nCount
        });
    };
    
    this.replaceData = function(nOffset, nCount, sValue){
        this.dispatchEvent("DOMCharacterDataModified", {
            offset: nOffset,
            count : nCount,
            value : sValue
        });
    };
    
    this.substringData = function(nOffset, nCount){};
}
apf.AmlCharacterData.prototype = new apf.AmlNode();
// #endif