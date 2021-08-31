"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.writeToFile = void 0;
var path_1 = require("path");
var fs_extra_1 = require("fs-extra");
var sync_1 = require("csv-parse/lib/sync");
var main_1 = require("./main");
var notUrlLinks = function (url) { return !(extractFromMarkdownLink(url)[1].startsWith("http")); };
function extractFromMarkdownLink(link) {
    var singleMatch = /\[([^[]+)\]\((.*)\)/;
    var _a = link.match(singleMatch) || [], _full = _a[0], text = _a[1], url = _a[2];
    return [text, url];
}
var isContentNode = function (obj) {
    return obj.isDir !== undefined;
};
var renameLinks = function (text, refMap) {
    var _a;
    var mdLinkRegx = /\[([^\]])+\]\(([^)])*\)/g;
    var matches = text.match(mdLinkRegx);
    return (_a = matches === null || matches === void 0 ? void 0 : matches.filter(notUrlLinks).reduce(function (acc, e) {
        var _a = extractFromMarkdownLink(e), label = _a[0], link = _a[1];
        if (link.endsWith("csv")) {
            var splitted = link.split("/");
            var csv = splitted[splitted.length - 1];
            var content = refMap.get(decodeURI(csv));
            if (!content || !isContentNode(content) || !content.content.file) {
                throw new Error("Csv " + content + " not found");
            }
            var _b = (0, sync_1["default"])(content.content.file.toString(), { skipEmptyLines: true, trim: true }), headers = _b[0], rows = _b.slice(1);
            var headersText = "| " + headers.map(function (c) { return c.trim(); }).join(" | ") + " | \n";
            var clearTableValue_1 = function (value) { return value.replace(/\n/g, "<br/>"); };
            var csvFolder_1 = splitted.map(decodeURI).map(function (c) { return refMap.get(c).name; });
            csvFolder_1[csvFolder_1.length - 1] = csvFolder_1[csvFolder_1.length - 1].replace(/(\.csv)$/g, "");
            var renderRow = function (_a) {
                var title = _a[0], rest = _a.slice(1);
                return "| [" + title + "](" + csvFolder_1.join("/") + "/" + (0, main_1.getNewName)(title) + ") | " + rest.map(function (c) { return clearTableValue_1(c); }).join(" | ") + " |";
            };
            var headerBorder = "|:" + headers.map(function (c) { return new Array(c.length).fill("-").join(""); }).join(":|:") + ":| \n";
            var valuesText = rows.map(renderRow).join("\n");
            var mdTable = headersText + headerBorder + valuesText;
            var linkRegx = new RegExp("\\[" + label + "\\]\\(" + link + "\\)", "g");
            return acc.replace(linkRegx, mdTable);
        }
        else {
            var formattedLink = decodeURI(link)
                .split("/")
                .map(function (c) {
                if (!refMap.has(c))
                    throw new Error(c + " not found in map");
                return refMap.get(c).name;
            })
                .join("/");
            var linkRegx = new RegExp("(" + link + ")", "g");
            return acc.replace(linkRegx, formattedLink);
        }
    }, text)) !== null && _a !== void 0 ? _a : text;
};
var getContentMap = function (root) {
    var map = new Map();
    function innerSet(node) {
        map.set(node.content.name, node);
        node.children.forEach(innerSet);
    }
    map.set(root.content.name, root);
    root.children.forEach(function (c) { return innerSet(c); });
    return map;
};
var safeMkdir = function (dir) { return !(0, fs_extra_1.existsSync)(dir) && (0, fs_extra_1.mkdirSync)(dir); };
function writeToFile(path, root) {
    var map = getContentMap(root);
    var copy = __assign(__assign({}, root), { name: (0, path_1.basename)(path) });
    safeMkdir(path);
    function mkChild(node, path) {
        var p = (0, path_1.join)(path, node.name);
        if (node.isDir) {
            safeMkdir(p);
            node.children.forEach(function (c) { return mkChild(c, p); });
        }
        else {
            var fileValue = node.content.file;
            if (!fileValue) {
                throw new Error("File exptected to have value " + node.name);
            }
            var textFileExt = ["md"];
            if (textFileExt.some(function (c) { return node.content.name.endsWith(c); })) {
                var text = fileValue.toString();
                (0, fs_extra_1.writeFileSync)(p, renameLinks(text, map));
            }
            else {
                (0, fs_extra_1.writeFileSync)(p, fileValue);
            }
        }
    }
    copy.children.forEach(function (c) { return mkChild(c, path); });
}
exports.writeToFile = writeToFile;
