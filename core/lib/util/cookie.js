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
 
// #ifdef __WITH_COOKIE

/**
 * Sets a name/value pair which is stored in the browser and sent to the server
 * with every request. This is also known as a cookie. Be careful setting 
 * cookies, because they can take up a lot of bandwidth, especially for Ajax
 * applications.
 * 
 * @param {String}  name     cookie name
 * @param {String}  value    cookie value
 * @param {Date}    expire   expire date representing the number of milliseconds
 *                           since 1 January 1970 00:00:00 UTC.
 * @param {String}  path     path name
 * @param {String}  domain   domain name
 * @param {Boolean} secure   cookie may benefit all the documents and CGI programs
 *                           meet the requirements as to the path and domain
 *                           compatibility
 *     Possible values:
 *     true   may benefit
 *     false  can not benefit
 *     
 * @return {String} Returns a cookie name.
 */
apf.setcookie = function(name, value, expire, path, domain, secure) {
    var ck = name + "=" + escape(value) + ";";
    if (expire) ck += "expires=" + new Date(expire
        + new Date().getTimezoneOffset() * 60).toGMTString() + ";";
    if (path)   ck += "path=" + path + ";";
    if (domain) ck += "domain=" + domain + ";";
    if (secure) ck += "secure";

    document.cookie = ck;
    return value
};

/**
 * Gets the value of a stored name/value pair called a cookie.
 * 
 * @param {String} name the name of the stored cookie.
 * @return {String} Returns a value of the cookie or the empty string if it isn't found
 */
apf.getcookie = function(name) {
  var aCookie = document.cookie.split("; ");
  for (var i = 0; i < aCookie.length; i++) {
      var aCrumb = aCookie[i].split("=");
      if (name == aCrumb[0])
          return unescape(aCrumb[1]);
  }

  return "";
};

/**
 * Deletes a stored name/value pair called a cookie.
 * 
 * @param {String} name     the name of the stored cookie
 * @param {String} domain   the name of the domain of stored cookie
 */
apf.delcookie = function (name, domain){
    document.cookie = name + "=blah; expires=Fri, 31 Dec 1999 23:59:59 GMT;"
        + (domain ? 'domain='+domain : '');
};

//#endif
