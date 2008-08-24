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
 
//#ifdef __WITH_UTIL_URL

jpf.url.ore = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$");
jpf.url.ire = new RegExp("^((([^:]+:)?([^@]+))@)?([^:]*)(:([0-9]+))?$");
jpf.url = function(/*dojo._Url||String...*/){
    // summary: 
    //        Constructor to create an object representing a URL.
    //        It is marked as private, since we might consider removing
    //        or simplifying it.
    // description: 
    //        Each argument is evaluated in order relative to the next until
    //        a canonical uri is produced. To get an absolute Uri relative to
    //        the current document use:
    //          new dojo._Url(document.baseURI, url)

    var n = null;

    // TODO: support for IPv6, see RFC 2732
    var _a = arguments;
    var uri = [_a[0]];
    // resolve uri components relative to each other
    for(var i = 1; i<_a.length; i++){
        if(!_a[i]) continue;

        // Safari doesn't support this.constructor so we have to be explicit
        // FIXME: Tracked (and fixed) in Webkit bug 3537.
        //        http://bugs.webkit.org/show_bug.cgi?id=3537
        var relobj = new jpf.url(_a[i]+"");
        var uriobj = new jpf.url(uri[0]+"");

        if(
            relobj.path == "" && !relobj.scheme 
            && !relobj.authority && !relobj.query
        ){
            if(relobj.fragment != n)
                uriobj.fragment = relobj.fragment;

            relobj = uriobj;
        }
        else if(!relobj.scheme){
            relobj.scheme = uriobj.scheme;

            if(!relobj.authority){
                relobj.authority = uriobj.authority;

                if(relobj.path.charAt(0) != "/"){
                    var path = uriobj.path.substring(0,
                        uriobj.path.lastIndexOf("/") + 1) + relobj.path;

                    var segs = path.split("/");
                    for(var j = 0; j < segs.length; j++){
                        if(segs[j] == "."){
                            // flatten "./" references
                            if(j == segs.length - 1)
                                segs[j] = "";
                            else{
                                segs.splice(j, 1);
                                j--;
                            }
                        }
                        else if(j > 0 && !(j == 1 && segs[0] == "") 
                          && segs[j] == ".." && segs[j-1] != ".."){
                            // flatten "../" references
                            if(j == (segs.length - 1)){
                                segs.splice(j, 1);
                                segs[j - 1] = "";
                            }
                            else{
                                segs.splice(j - 1, 2);
                                j -= 2;
                            }
                        }
                    }
                    
                    relobj.path = segs.join("/");
                }
            }
        }

        uri = [];
        if(relobj.scheme)
            uri.push(relobj.scheme, ":");
        if(relobj.authority)
            uri.push("//", relobj.authority);
            
        uri.push(relobj.path);
        
        if(relobj.query)
            uri.push("?", relobj.query);
        if(relobj.fragment)
            uri.push("#", relobj.fragment);
    }

    this.uri = uri.join("");

    // break the uri into its main components
    var r = this.uri.match(jpf.url.ore);

    this.scheme = r[2] || (r[1] ? "" : n);
    this.authority = r[4] || (r[3] ? "" : n);
    this.path = r[5]; // can never be undefined
    this.query = r[7] || (r[6] ? "" : n);
    this.fragment  = r[9] || (r[8] ? "" : n);

    if(this.authority != n){
        // server based naming authority
        r = this.authority.match(jpf.url.ire);

        this.user = r[3] || n;
        this.password = r[4] || n;
        this.host = r[5];
        this.port = r[7] || n;
    }
    
    this.toString = function(){
        return this.uri;
    }
    
    this.isSameLocation = function(){
		// filter out anchors
		if(this.uri.length && this.uri.charAt(0) == "#")
			return false;
		
		// totally relative -- ../../someFile.html
		if(!this.scheme && !this.port && !this.host){ 
			return true;
		}
		
		// scheme relative with port specified -- brad.com:8080
		if(!this.scheme && this.host && this.port
				&& window.location.hostname == this.host
				&& window.location.port == this.port){
			return true;
		}
		
		// scheme relative with no-port specified -- brad.com
		if(!this.scheme && this.host && !this.port
			&& window.location.hostname == this.host
			&& window.location.port == 80){
			return true;
		}
		
		// else we have everything
		return  window.location.protocol == (this.scheme + ":")
				&& window.location.hostname == this.host
				&& (window.location.port == this.port || !window.location.port && !this.port);
    }
}

//#endif