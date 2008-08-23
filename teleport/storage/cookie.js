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

// #ifdef __STORAGE_RPC

jpf.storage.cookie = function(instrType, data, options, xmlContext, callback, multicall, userdata, arg, isGetRequest){
    var parsed    = this.parseInstructionPart(data.join(":"),
        xmlContext, arg);
    
    var q         = parsed.name.split(".");
    var cur_value = jpf.getcookie(q[0]);
    cur_value     = cur_value ? jpf.unserialize(cur_value) || {} : {};
    
    if (!isGetRequest)
        cur_value[q[1]] = parsed.arguments[0];

    jpf.setcookie(q[0], jpf.serialize(cur_value));
    if (callback)
        callback(cur_value ? cur_value[q[1]] : null,
            __HTTP_SUCCESS__, {userdata:userdata});
}

// #endif
