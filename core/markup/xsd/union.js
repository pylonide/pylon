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

//#ifdef __WITH_XSDUNION
/*
  <xs:simpleType name="SizeType">
    <xs:union memberTypes="DressSizeType">
      <xs:simpleType>
        <xs:restriction base="xs:token">
          <xs:enumeration value="small"/>
          <xs:enumeration value="medium"/>
          <xs:enumeration value="large"/>
        </xs:restriction>
      </xs:simpleType>
    </xs:union>
  </xs:simpleType>

  <xs:simpleType name="DressSizeType">
    <xs:restriction base="xs:integer">
      <xs:minInclusive value="2"/>
      <xs:maxInclusive value="18"/>
    </xs:restriction>
  </xs:simpleType>
*/
apf.XsdUnion = function(struct, tagName){
    this.$init(tagName || "union", apf.NODE_HIDDEN, struct);
};

(function(){
    this.$propHandlers["memberTypes"] = function(value){
        this.$memberTypes = value.splitSafe(" ");
        this.parentNode.$recompile();
    };
    
    this.$compile = function(stack){
        var i, l, node,
            nodes = this.childNodes;
        for (i = 0, l = this.$memberTypes.length; i < l; i++) {
            stack.push("if (apf.xsd.checkType('"
              + this.$memberTypes[i] + "', value)) return true;");
        }

        for (i = 0, l = nodes.length; i < l; i++)
            (node = nodes[i]).$compile && node.$compile(stack);
    }
}).call(apf.XsdUnion.prototype = new apf.XsdElement());

apf.xsd.setElement("union", apf.XsdUnion);
//#endif