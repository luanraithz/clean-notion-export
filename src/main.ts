import fs, { existsSync, readFileSync, writeFileSync } from "fs";
import { join, extname, basename } from "path"

const guidRegexp = /\s*[({]?[a-fA-F0-9]{8}[-]?([a-fA-F0-9]{4}[-]?){3}[a-fA-F0-9]{12}[})]?$/g

const withoutExtension = (str: string) => {
  const extension = extname(str)
  if (extension) {
    return [str.replace(extension, ""), extension]
  }
  return [str, ""]
}

export function getNewName(n: string, { toLower = true, removeWhiteSpaces = true } = {}) {
  const [value, extension] = withoutExtension(n)
  let formatedValue = value
    .replace(guidRegexp, "");

  if (toLower) formatedValue = formatedValue.toLowerCase()
  if (removeWhiteSpaces) formatedValue = formatedValue.replace(/\s/g, "_")

  return `${formatedValue}${extension}`
}


export type ContentRoot = {
  name: string,
  children: Array<ContentNode>
}

export type ContentNode = {
  name: string,
  children: Array<ContentNode>,
  isDir: boolean,
  file?: Buffer
}

export type OutputContentRoot = {
  content: ContentRoot,
  name: string,
  children: Array<OutputContentNode>,
}

export type OutputContentNode = {
  content: ContentNode,
  name: string,
  children: Array<OutputContentNode>,
  isDir: boolean,
}

export function mapToNewNames(root: ContentRoot): OutputContentRoot {
  function innerMap(innerRoot: ContentNode): OutputContentNode {
    const children = innerRoot.children.map(n => {
      if (!n.children.length) {
        const name = getNewName(n.name)
        return {
          name,
          content: n,
          children: [],
          isDir: false
        } as OutputContentNode;
      } else {
        const name = getNewName(n.name)
        return {
          name,
          content: n,
          children: n.children.map(c => innerMap(c)),
          isDir: true
        } as OutputContentNode;
      }
    });

    return {
      name: getNewName(innerRoot.name),
      children,
      content: innerRoot,
      isDir: Boolean(innerRoot.children.length),
    }
  }
  const value: OutputContentRoot = {
    name: getNewName(root.name),
    children: root.children.map(c => innerMap(c)),
    content: root
  }
  return value
}

type OutputMap = Map<string, OutputContentNode | OutputContentRoot>

export function normalizeOutputAsMap(outContent: OutputContentRoot | OutputContentNode): OutputMap {
  const map = new Map();
  function normalizeChildren(cont: OutputContentNode | OutputContentRoot, path: string, map: OutputMap) {
    const pathSoFar = path ? [path, cont.name].join("/") : cont.name
    map.set(pathSoFar, cont)
    cont.children.map(c => normalizeChildren(c, pathSoFar, map))
  }
  normalizeChildren(outContent, "", map);
  return map
}

export const printStruct = (root: { name: string, children: Array<{ name: string, children: any }> }, tabCount = 0): string => {
  const str = new Array(tabCount).fill(" ").join(" ") + root.name + (root.children.length ? "/" : "") + "\n"
  return str + root.children.map(p => printStruct(p, tabCount + 2)).join("")
}

export function listDirRecursive(absolutePath: string): ContentRoot {
  function innerMap(absolutePath: string, relativePath: string): ContentNode {
    const files = fs.readdirSync(absolutePath, { withFileTypes: true })
    const children: ContentNode[] = files.map(f => {
      const relative = join(relativePath, f.name)
      const absolute = join(absolutePath, f.name)
      return f.isDirectory() ?
        innerMap(absolute, relative) :
        { name: f.name, children: [], isDir: false, file: readFileSync(absolute) } as ContentNode
    });
    return {
      name: basename(absolutePath),
      children,
      isDir: true,
    };
  }
  const { children, name } = innerMap(absolutePath, "")
  return { name, children }
}

export type ContentMap = Map<string, OutputContentNode | OutputContentRoot>
