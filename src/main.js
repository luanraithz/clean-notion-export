"use strict";
exports.__esModule = true;
exports.listDirRecursive = exports.printStruct = exports.normalizeOutputAsMap = exports.mapToNewNames = exports.getNewName = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var guidRegexp = /\s*[({]?[a-fA-F0-9]{8}[-]?([a-fA-F0-9]{4}[-]?){3}[a-fA-F0-9]{12}[})]?$/g;
var withoutExtension = function (str) {
    var extension = (0, path_1.extname)(str);
    if (extension) {
        return [str.replace(extension, ""), extension];
    }
    return [str, ""];
};
function getNewName(n, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.toLower, toLower = _c === void 0 ? true : _c, _d = _b.removeWhiteSpaces, removeWhiteSpaces = _d === void 0 ? true : _d;
    var _e = withoutExtension(n), value = _e[0], extension = _e[1];
    var formatedValue = value
        .replace(guidRegexp, "");
    if (toLower)
        formatedValue = formatedValue.toLowerCase();
    if (removeWhiteSpaces)
        formatedValue = formatedValue.replace(/\s/g, "_");
    return "" + formatedValue + extension;
}
exports.getNewName = getNewName;
function mapToNewNames(root) {
    function innerMap(innerRoot) {
        var children = innerRoot.children.map(function (n) {
            var hasChildren = Boolean(n.children.length);
            var name = getNewName(n.name);
            return {
                name: name,
                content: n,
                children: n.children.map(function (c) { return innerMap(c); }),
                isDir: hasChildren
            };
        });
        return {
            name: getNewName(innerRoot.name),
            children: children,
            content: innerRoot,
            isDir: Boolean(innerRoot.children.length)
        };
    }
    var value = {
        name: getNewName(root.name),
        children: root.children.map(function (c) { return innerMap(c); }),
        content: root
    };
    return value;
}
exports.mapToNewNames = mapToNewNames;
function normalizeOutputAsMap(outContent) {
    var map = new Map();
    function normalizeChildren(cont, path, map) {
        var pathSoFar = path ? [path, cont.name].join("/") : cont.name;
        map.set(pathSoFar, cont);
        cont.children.map(function (c) { return normalizeChildren(c, pathSoFar, map); });
    }
    normalizeChildren(outContent, "", map);
    return map;
}
exports.normalizeOutputAsMap = normalizeOutputAsMap;
var printStruct = function (root, tabCount) {
    if (tabCount === void 0) { tabCount = 0; }
    var str = new Array(tabCount).fill(" ").join(" ") + root.name + (root.children.length ? "/" : "") + "\n";
    return str + root.children.map(function (p) { return (0, exports.printStruct)(p, tabCount + 2); }).join("");
};
exports.printStruct = printStruct;
function listDirRecursive(absolutePath) {
    function innerMap(absolutePath, relativePath) {
        var files = fs_1["default"].readdirSync(absolutePath, { withFileTypes: true });
        var children = files.map(function (f) {
            var relative = (0, path_1.join)(relativePath, f.name);
            var absolute = (0, path_1.join)(absolutePath, f.name);
            return f.isDirectory() ?
                innerMap(absolute, relative) :
                { name: f.name, children: [], isDir: false, file: (0, fs_1.readFileSync)(absolute) };
        });
        return {
            name: (0, path_1.basename)(absolutePath),
            children: children,
            isDir: true
        };
    }
    var _a = innerMap(absolutePath, ""), children = _a.children, name = _a.name;
    return { name: name, children: children };
}
exports.listDirRecursive = listDirRecursive;
