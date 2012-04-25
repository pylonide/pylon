var connections = new Array();  
connections.length = 0;

var BYTES_PER_CHUNK = 1024 * 1024; // 1MB chunk sizes.
var CHUNK_UPLOAD = true;
var port;

self.addEventListener("connect", function (e) {  
    port = e.ports[0];
    
    port.addEventListener("message", function (e) {  
      var data = e.data;
      if (!data.cmd) {
        port.postMessage({value: "No cmd specified"});
      } else {
        switch (data.cmd) {
          case 'connect':
            var filepath = data.path + "/" + data.file.name;
            
            if (!(filepath in connections)) {
              connections[filepath] = null;
              connections.length++;
              port.postMessage({value: data.id + " has connected on port #" + connections.length + "."});
            }        
            port.postMessage({value: "Received cmd of '" + data.cmd + "' from " + data.id + "."});
            port.postMessage({connections: connections.length});
            if (connections.length == 1) {
              port.postMessage({value: "Starting...", filename: data.file.name});
              
              // Processing ...
              var file = data.file;
                var reader = new FileReader();
                // Init the reader event handlers
                reader.onloadend = function(e){
                    var filename = file.name;
                    var filepath = data.path + "/" + filename;
                    
                    if (CHUNK_UPLOAD) {
                        var blob = file;
                        var blobsize = blob.size;
            
                        var start = 0;
                        var end = BYTES_PER_CHUNK;
                        port.postMessage({blobsize: blobsize, start: start});
                        while(start < blobsize) {
                            // Note: blob.slice has changed semantics and been prefixed. See http://goo.gl/U9mE5.
                            if ('mozSlice' in blob) {
                                var chunk = blob.mozSlice(start, end);
                            } else {
                                var chunk = blob.webkitSlice(start, end);
                            }
                            
                            self.uploadChunk(chunk, filepath, blobsize, end);
                        
                            start = end;
                            end = start + BYTES_PER_CHUNK;
                        }
                    }
                    else {
                        var http = new XMLHttpRequest();
                        http.open("PUT", filepath, true);
                        http.onreadystatechange = function(){
                            if (http.readyState != 4)
                                return;
            
                            port.postMessage({type: 1, value: "file uploaded:" + http.status});
                        }
                        http.setRequestHeader("Cache-Control", "no-cache");
                        http.setRequestHeader("X-File-Name", filename);
                        http.setRequestHeader("X-File-Size", file.size);
                        http.setRequestHeader("Content-Type", "application/octet-stream");
                        http.send(e.target.result);
                    }
                }
                // Begin the read operation
                reader.readAsBinaryString(data.file);
              
            }
            break;
          case 'upload':
              port.postMessage({value: "test"}); //data.file.name
            break;
          default:
            port.postMessage({value: "unknown cmd"}); //data.file.name
        }
      }
    }, false);  
    port.start();  
}, false);

// uploading file in chunks
self.uploadChunk = function(chunk, filepath, filesize, end) {
    var http = new XMLHttpRequest();
    http.open("PUT", filepath, true);
    http.onreadystatechange = function(){
        if (http.readyState != 4)
            return;
        
        // file upload complete
        if (end < filesize)
            port.postMessage({type: "progress", value: end/filesize});
        else {
            delete connections[filepath];
            connections.length--;
            port.postMessage({type: "complete"});
        }
    }
    /*
    http.setRequestHeader("Cache-Control", "no-cache");
    http.setRequestHeader("X-File-Name", filename);
    http.setRequestHeader("X-File-Size", filesize);
    http.setRequestHeader("Content-Type", "application/octet-stream");
    */
    http.send(chunk);
};

/*
self.addEventListener('message', function(e) {
    var data = e.data;
    switch (data.cmd) {
        case "connect":
            var file = data.file;
            
            var reader = new FileReader();
            // Init the reader event handlers
            reader.onloadend = function(e) {
                var filename = file.name;
                
                var http = new XMLHttpRequest();
                http.open("PUT", data.path + "/" + filename, true);
                http.onreadystatechange = function(){
                    if (http.readyState != 4)
                        return;
                    file.data = e.target.result
                    self.postMessage({msg: "uploadcomplete", status: http.status, file: file});
                }
                http.setRequestHeader("Cache-Control", "no-cache");
                http.setRequestHeader("X-File-Name", filename);
                http.setRequestHeader("X-File-Size", file.size);
                http.setRequestHeader("Content-Type", "application/octet-stream");

                //http.send(e.target.result);
                self.postMessage({msg: "result.length", val: e.target.result.length});
                //http.send(e.target.result.substring(0, 2000000));
            }
            
            reader.onload = function(e) {
                self.postMessage({msg: "onload"});
            }
            
            reader.onerror = function(e) {
                self.postMessage({msg: "uploaderror", val: e.code});
            }
            
            // Begin the read operation
            reader.readAsBinaryString(data.file);
            
            break;
        default:
            self.postMessage({msg: "invalid cmd", val: data.cmd});
    }
});
*/