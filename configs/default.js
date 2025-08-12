/*global require process module __dirname*/
/**
 * Default/vanilla Pylon configuration.
 *
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

const fs = require("fs");
const path = require("path");

// yargs v18+: use yargs/yargs + hideBin, and declare options explicitly
const { hideBin } = require("yargs/helpers");
const argv = require("yargs/yargs")(hideBin(process.argv))
  .option("p", {
    alias: "port",
    type: "number",
    describe: "Port to listen on",
    default: process.env.PORT ? Number(process.env.PORT) : 3131
  })
  .option("l", {
    alias: "host",
    type: "string",
    describe: "Host to bind",
    default: process.env.IP || "localhost"
  })
  .option("b", {
    alias: "debugPort",
    type: "number",
    describe: "Debug port",
    default: process.env.DEBUG_PORT ? Number(process.env.DEBUG_PORT) : 5858
  })
  .option("w", {
    alias: "workspace",
    type: "string",
    describe: "Workspace directory (project root)"
  })
  .option("username", { type: "string", describe: "Auth username" })
  .option("password", { type: "string", describe: "Auth password" })
  // keep behavior loose: allow unknown flags, suppress default help/version output
  .strict(false)
  .help(false)
  .version(false)
  .parse();

const clientExtensions = {};
const clientDirs = fs.readdirSync(__dirname + "/../plugins-client");
for (let i = 0; i < clientDirs.length; i++) {
  const dir = clientDirs[i];
  if (dir.indexOf("ext.") !== 0) continue;

  const name = dir.split(".")[1];
  clientExtensions[name] = __dirname + "/../plugins-client/" + dir;
}

const projectDir =
  process.env.PLN_WORKSPACE ||
  (argv.w && path.resolve(process.cwd(), argv.w)) ||
  process.cwd();

const fsUrl = "/workspace";
const vfsUrl = "/vfs";

const port = argv.p;
const host = argv.l;
const debugPort = argv.b;
const termLocal = Boolean(
  process.env.PLN_TERMLOCAL || host === "localhost" || host === "127.0.0.1"
);

const useAuth = argv.username && argv.password;

const sessionsPath =
  process.env.PLN_SESSIONS_PATH || __dirname + "/../.sessions";
const settingsPath = process.env.PLN_SETTINGS_FILE || ".settings";

const config = [
  {
    packagePath: "./connect",
    port: port,
    host: host
  },
  {
    packagePath: "./connect.static",
    prefix: "/static"
  },
  "./pylon.alive",
  "./pylon.debug",

  // Client libraries
  "./../plugins-client/pylon.core",
  "./../plugins-client/lib.ace",
  "./../plugins-client/lib.ppc",
  "./../plugins-client/lib.treehugger",
  "./../plugins-client/lib.v8debug",
  "./../plugins-client/lib.requirejs",
  "./../plugins-client/lib.xterm",
  "./../plugins-client/lib.hexview",
  "./pylon.smith.io",
  {
    packagePath: "./pylon.ide.smith.io",
    messageRegex: /(\/smith.io-ide)/
  },
  // server plugins
  {
    packagePath: "./pylon.sandbox",
    projectDir: projectDir,
    workspaceId: "Pylon",
    userDir: null, // is this always there??
    unixId: null,
    host: host
  },
  {
    packagePath: "./pylon.core",
    version: require("../package.json").version,
    c9debug: false,
    fsUrl: fsUrl,
    smithIo: {
      port: port,
      prefix: "/smith.io-ide"
    },
    hosted: false,
    bundledPlugins: ["helloworld"],
    packed: false,
    packedName: "",
    clientPlugins: [
      "ext/filesystem/filesystem",
      "ext/settings/settings",
      "ext/editors/editors",
      //"ext/connect/connect",
      "ext/themes/themes",
      "ext/themes_default/themes_default",
      "ext/panels/panels",
      "ext/dockpanel/dockpanel",
      "ext/openfiles/openfiles",
      "ext/tree/tree",
      "ext/save/save",
      "ext/recentfiles/recentfiles",
      "ext/gotofile/gotofile",
      "ext/newresource/newresource",
      "ext/undo/undo",
      "ext/clipboard/clipboard",
      "ext/searchinfiles/searchinfiles",
      "ext/searchreplace/searchreplace",
      "ext/quickwatch/quickwatch",
      "ext/gotoline/gotoline",
      "ext/preview/preview",
      // "ext/deploy/deploy",
      //"ext/log/log",
      "ext/help/help",
      "ext/linereport/linereport",
      "ext/linereport_php/linereport_php",
      "ext/linereport_python/linereport_python",
      //"ext/ftp/ftp",
      "ext/code/code",
      "ext/statusbar/statusbar",
      "ext/imgview/imgview",
      //"ext/preview/preview",
      "ext/extmgr/extmgr",
      //"ext/run/run", //Add location rule
      "ext/runpanel/runpanel", //Add location rule
      "ext/debugger/debugger", //Add location rule
      "ext/dbg-node/dbg-node",
      "ext/noderunner/noderunner", //Add location rule
      "ext/console/console",
      "ext/consolehints/consolehints",
      "ext/tabbehaviors/tabbehaviors",
      "ext/tabsessions/tabsessions",
      //"ext/keybindings/keybindings",
      "ext/keybindings_default/keybindings_default",
      "ext/watcher/watcher",
      "ext/dragdrop/dragdrop",
      "ext/menus/menus",
      "ext/tooltip/tooltip",
      "ext/sidebar/sidebar",
      "ext/filelist/filelist",
      "ext/beautify/beautify",
      "ext/offline/offline",
      "ext/stripws/stripws",
      //"ext/testpanel/testpanel",
      "ext/zen/zen",
      "ext/codecomplete/codecomplete",
      "ext/vim/vim",
      "ext/anims/anims",
      "ext/guidedtour/guidedtour",
      "ext/quickstart/quickstart",
      "ext/jslanguage/jslanguage",
      "ext/csslanguage/csslanguage",
      "ext/htmllanguage/htmllanguage",
      //"ext/autotest/autotest",
      "ext/closeconfirmation/closeconfirmation",
      "ext/codetools/codetools",
      "ext/colorpicker/colorpicker",
      "ext/gitblame/gitblame",
      //"ext/githistory/githistory",
      "ext/autosave/autosave",
      "ext/revisions/revisions",
      "ext/language/liveinspect",
      "ext/splitview/splitview",
      "ext/terminal/terminal",
      "ext/hexview/hexview"
    ]
  },
  {
    packagePath: "@pylonide/vfs-architect/local",
    root: "/"
  },
  {
    packagePath: "@pylonide/vfs-architect/http-adapter",
    mount: vfsUrl,
    httpRoot: "http://localhost:" + port + vfsUrl
  },
  {
    packagePath: "./pylon.fs",
    urlPrefix: fsUrl
  },
  {
    packagePath: "./pylon.socket",
    socketPath: "/smith.io-ide"
  },
  {
    packagePath: "./connect.session",
    name: "pylon.sid." + port,
    secret: "v1234",
    saveUninitialized: true
  },
  {
    packagePath: "./connect.session.file",
    sessionsPath: sessionsPath,
    maxAge: 86400
  },
  "./pylon.permissions",
  {
    packagePath: "./pylon.client-plugins",
    plugins: clientExtensions
  },
  "./pylon.eventbus",
  "./pylon.process-manager",
  "./pylon.routes",
  "./pylon.run.shell",
  {
    packagePath: "./pylon.run.node",
    listenHint:
      "Important: in your scripts, use 'process.env.PORT' as port and '0.0.0.0' as host."
  },
  {
    packagePath: "./pylon.run.node-debug",
    listenHint:
      "Important: in your scripts, use 'process.env.PORT' as port and '0.0.0.0' as host.",
    debugPort: debugPort
  },
  "./pylon.run.npm",
  "./pylon.run.npmnode",
  "./pylon.run.ruby",
  "./pylon.run.python",
  "./pylon.run.apache",
  "./pylon.run.php",
  "architect/plugins/architect.log",
  "./pylon.ide.auth",
  "./pylon.ide.git",
  "./pylon.ide.gittools",
  "./pylon.ide.hg",
  "./pylon.ide.npm",
  "./pylon.ide.filelist",
  "./pylon.ide.search",
  "./pylon.ide.run-node",
  {
    packagePath: "./pylon.ide.run-npm-module",
    allowShell: true
  },
  "./pylon.ide.run-python",
  "./pylon.ide.run-apache",
  "./pylon.ide.run-ruby",
  "./pylon.ide.run-php",
  "./pylon.run.python",
  "./pylon.ide.revisions",
  {
    packagePath: "./pylon.ide.settings",
    settingsPath: settingsPath
  },
  "./pylon.ide.shell",
  "./pylon.ide.state",
  "./pylon.ide.watcher",
  {
    packagePath: "./pylon.ide.terminal",
    localOnly: termLocal
  }
];

if (useAuth) {
  config.push({
    packagePath: "./pylon.connect.form-auth",
    username: argv.username,
    password: argv.password
  });
  // Client Side form-auth is only required if we use the server side component
  config
    .find((obj) => obj.packagePath === "./pylon.core")
    .clientPlugins.push("ext/form-auth/form-auth");
}

module.exports = config;