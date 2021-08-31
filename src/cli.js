#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var path_1 = require("path");
var process_1 = require("process");
var yargs_1 = require("yargs");
var argv = (0, yargs_1["default"])(process.argv).argv;
var main_1 = require("./main");
var write_to_file_1 = require("./write-to-file");
var outputPath = argv.output;
var entryPath = argv.entry;
if (!outputPath || !entryPath) {
    console.log("Please provide the --entry and the --output arguments");
    (0, process_1.exit)(1);
}
var currentPath = process.cwd();
var contentNodes = (0, main_1.listDirRecursive)((0, path_1.join)(currentPath, entryPath));
var output = (0, main_1.mapToNewNames)(contentNodes);
(0, write_to_file_1.writeToFile)((0, path_1.join)(currentPath, outputPath), output);
