module.exports = {
    name: "DAV",
    tmpdir: __dirname + "/../.architect",
    containers: {
        master: {
            title: "WebDAV server",
            plugins: [{
                packagePath: __dirname + "/../plugins-server/cloud9.connect",
                port: process.env.PORT || 3131,
                host: "localhost"
            },
            __dirname + "/../plugins-server/cloud9.permissions",
            __dirname + "/../plugins-server/cloud9.log",
            {
                packagePath: __dirname + "/../plugins-server/cloud9.fs",
                mountDir: __dirname + "/../",
                urlPrefix: "/"
            }]
        }
    }
};