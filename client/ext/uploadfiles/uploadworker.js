var connections = new Array();  
connections.length = 0;

var BYTES_PER_CHUNK = 256 * 1024; // 256k chunk sizes.

self.onmessage = function (e) {  
    var data = e.data;
    if (!data.cmd) {
        self.postMessage({value: "No cmd specified"});
    } else {
        switch (data.cmd) {
            case 'connect':
                var filepath = data.path + "/" + data.file.name;
                
                if (!(filepath in connections)) {
                    connections[filepath] = {};
                    connections.length++;
                    
                    if (connections.length > 1) {
                        self.postMessage({value: "Error: Too many connections"});
                        return; 
                    }
                    
                    self.postMessage({value: data.id + " has connected on port #" + connections.length + "."});
                    self.postMessage({value: "Starting...", filename: data.file.name});
                    
                    // Processing ...
                    var file = data.file;
                    var reader = new FileReader();
                    
                    reader.onloadend = function(e){
                        var filename = file.name;
                        var filepath = data.path + "/" + filename;
                        
                        var blob = file;
                        var blobsize = blob.size;
            
                        var start = 0;
                        var end = BYTES_PER_CHUNK;
                        if (end > blobsize)
                            end = blobsize;
                            
                        function next(error){
                            if (error) {
                                self.postMessage({type: "paused", error: error, filepath: filepath});
                                return;
                            }
                            
                            // Note: blob.slice has changed semantics and been prefixed. See http://goo.gl/U9mE5.
                            if ('mozSlice' in blob) {
                                var chunk = blob.mozSlice(start, end);
                            } else {
                                var chunk = blob.webkitSlice(start, end);
                            }
                            
                            self.uploadChunk(chunk, filepath, end, blobsize, next);
                        
                            start = end;
                            end = start + BYTES_PER_CHUNK;
                            if (end > blobsize)
                                end = blobsize;
                        }
                        connections[filepath].next = next;
                        
                        next();
                    }
                    // Begin the read operation
                    reader.readAsBinaryString(data.file);
                }
                else {
                    connections[filepath].next();
                }
                
                break;
            default:
                self.postMessage({value: "unknown cmd"});
        }
    }
};

// uploading file in chunks
self.uploadChunk = function(chunk, filepath, end, blobsize, next) {
    var http = new XMLHttpRequest();
    http.open("PUT", filepath, true);
    http.onreadystatechange = function(){
        if (http.readyState != 4)
            return;
        
        if (end == blobsize) {
            // file upload complete
            delete connections[filepath];
            connections.length--;
            return self.postMessage({type: "complete"});
        }
        
        self.postMessage({type: "progress", value: end/blobsize});
        
        next(http.status < 200 || http.status > 299 ? http.status : 0);
    }
    /*
    http.setRequestHeader("Cache-Control", "no-cache");
    http.setRequestHeader("X-File-Name", filename);
    http.setRequestHeader("X-File-Size", filesize);
    http.setRequestHeader("Content-Type", "application/octet-stream");
    */
    http.send(chunk);
};