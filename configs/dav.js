module.exports = {
    name: "DAV",
    tmpdir: __dirname + "/../.architect",
    basePath: __dirname + "/../plugins-server",
    containers: {
        master: {
            title: "WebDAV server",
            plugins: [{
                packagePath: "./cloud9.connect",
                port: process.env.PORT || 3131,
                host: "localhost"
            },
            "./cloud9.permissions",
            "./cloud9.log",
            {
                packagePath: "./cloud9.fs",
                mountDir: __dirname + "/../",
                urlPrefix: "/"
            }]
        }
    }
};