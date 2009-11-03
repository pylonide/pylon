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

// #ifdef __PARSER_AML
/**
 * The parser of the Ajax.org Markup Language. Besides aml this parser takes care
 * of distributing parsing tasks to other parsers like the native html parser and
 * the xsd parser.
 * @parser
 * @private
 *
 * @define include element that loads another aml files.
 * Example:
 * <code>
 *   <a:include src="bindings.aml" />
 * </code>
 * @attribute {String} src the location of the aml file to include in this application.
 * @addnode global, anyaml
 */
apf.aml = new apf.AmlNamespace();
apf.setNamespace("http://ajax.org/2005/aml", apf.aml);
//#endif