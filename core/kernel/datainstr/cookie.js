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

// #ifdef __DATAINSTR_COOKIE

jpf.datainstr.cookie = function(instrType, data, options, xmlContext, callback, multicall, userdata, arg, isGetRequest){
    var query  = data.join(":");
    var parsed = query.indexOf("=") > -1 
        ? this.parseInstructionPart(query.replace(/\s*=\s*/, "(") + ")"), 
            xmlContext, arg)
        : {name: data, arguments: arg || [xmlContext]};

    var value;
    if (isGetRequest){
        value = jpf.getcookie(parsed.name);
        value = value ? jpf.unserialize(value) || {} : {};
    }
    else{
        value = jpf.setcookie(parsed.name, 
            jpf.serialize(parsed.arguments[0]));
    }

    if (callback)
        callback(value || parsed.arguments[0], 
            __HTTP_SUCCESS__, {userdata:userdata});
}

// #endif
