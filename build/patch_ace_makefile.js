#!/usr/bin/env node
/*
 * Generates MakefilePylon.dryice.js from ace's Makefile.dryice.js for the
 * postinstall build. Must be run with the current working directory set to
 * the ace directory (node_modules/ace).
 *
 * Patches applied:
 *  1. architect-build requires are rescoped to @pylonide/architect-build.
 *  2. tool/ace_declaration_generator is replaced with stubs. It depends on
 *     the legacy TypeScript compiler API (removed in TypeScript 7) and is
 *     only exercised by ace's noconflict builds, which Pylon's minimal
 *     build never runs — but the require alone crashes under TS 7.
 *  3. The ES5 downlevel (ts.transpileModule) becomes a pass-through.
 *     TypeScript 7 ships no JS transpile API and removed the ES5 target;
 *     browsers supported by Pylon run ace's source syntax natively.
 *
 * Each patch asserts its pattern matched so that an ace upgrade which
 * reshapes Makefile.dryice.js aborts the install instead of silently
 * producing a broken build.
 */
var fs = require("fs");

function patch(source, pattern, replacement, what) {
    var out = source.replace(pattern, replacement);
    if (out === source)
        throw new Error("patch_ace_makefile: '" + what + "' did not match " +
            "Makefile.dryice.js — the ace version bump likely changed its " +
            "build script; update build/patch_ace_makefile.js accordingly.");
    return out;
}

var src = fs.readFileSync("Makefile.dryice.js", "utf8");

src = patch(src, /architect-build\//g,
    "@pylonide/architect-build/",
    "architect-build scoped package rename");

src = patch(src, /var \{[\s\S]*?\} = require\('\.\/tool\/ace_declaration_generator'\);/,
    "var updateDeclarationModuleNames = function(x) { return x; },\n" +
    "    generateDeclaration = function() {},\n" +
    "    SEPARATE_MODULES = [];",
    "ace_declaration_generator stub");

src = patch(src, /function compileTypescript\(code\) \{[\s\S]*?\n    \}/,
    "function compileTypescript(code) { return code; }",
    "compileTypescript pass-through");

fs.writeFileSync("MakefilePylon.dryice.js", src, "utf8");
console.log("MakefilePylon.dryice.js generated (TypeScript-free ace build)");
