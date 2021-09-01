import { basename, join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs-extra";
import parseCsv from "csv-parse/lib/sync"
import { ContentMap, getNewName, OutputContentNode, OutputContentRoot } from "./main";

const notUrlLinks = (url: string) => !(extractFromMarkdownLink(url)[1].startsWith("http"))

function extractFromMarkdownLink(link: string): [string, string] {
  const singleMatch = /\[([^[]+)\]\((.*)\)/
  const [_full, text, url] = link.match(singleMatch) || []
  return [text, url]
}
const isContentNode = (obj: OutputContentRoot | OutputContentNode): obj is OutputContentNode => {
  return (obj as OutputContentNode).isDir !== undefined
}
const renameLinks = (text: string, refMap: ContentMap): string => {
  const mdLinkRegx = /\[([^\]])+\]\(([^)])*\)/g
  const matches = text.match(mdLinkRegx)
  return matches?.filter(notUrlLinks)
    .reduce((acc, e) => {
      const [label, link] = extractFromMarkdownLink(e)
      if (link.endsWith("csv")) {
        const splitted = link.split("/")
        const csv = splitted[splitted.length - 1]
        const content = refMap.get(decodeURI(csv))
        if (!content || !isContentNode(content) || !content.content.file) {
          console.log(`Csv ${content} - with link ${csv} not found`)
          return acc
        }
        const [headers, ...rows] = parseCsv(content.content.file.toString(), { skipEmptyLines: true, trim: true })
        const headersText = `| ${headers.map((c: string) => c.trim()).join(" | ")} | \n`
        const clearTableValue = (value: string) => value.replace(/\n/g, "<br/>")
        const csvFolder = splitted.map(decodeURI).map(c => refMap.get(c)!.name)
        csvFolder[csvFolder.length - 1] = csvFolder[csvFolder.length - 1].replace(/(\.csv)$/g, "")
        const renderRow = ([title, ...rest]: string[]) => `| [${title}](${csvFolder.join("/")}/${getNewName(title)}) | ${rest.map((c: string) => clearTableValue(c)).join(" | ")} |`
        const headerBorder = `|:${headers.map((c: string) => new Array(c.length).fill("-").join("")).join(":|:")}:| \n`
        const valuesText = rows.map(renderRow).join("\n")
        const mdTable = headersText + headerBorder + valuesText
        const linkRegx = new RegExp(`\\[${label}\\]\\(${link}\\)`, "g")
        return acc.replace(linkRegx, mdTable)
      } else {
        const formattedLink = decodeURI(link)
          .split("/")
          .filter(c => {
            if (!refMap.has(c)) {
              console.log(`${c} not found in map`)
              return false
            }
            return true
          })
          .map(c => refMap.get(c)!.name)
          .join("/")
        const linkRegx = new RegExp(`(${link.replace("(", "\\(").replace(")", "\\)")})`, "g")
        return acc.replace(linkRegx, formattedLink)
      }
    }, text) ?? text
}

const getContentMap = (root: OutputContentRoot): ContentMap => {
  const map: ContentMap = new Map();
  function innerSet(node: OutputContentNode) {
    map.set(node.content.name, node)
    node.children.forEach(innerSet)
  }
  map.set(root.content.name, root)
  root.children.forEach(c => innerSet(c))
  return map
}

const safeMkdir = (dir: string) => !existsSync(dir) && mkdirSync(dir)

export function writeToFile(path: string, root: OutputContentRoot): void {
  const map = getContentMap(root);
  const copy = { ...root, name: basename(path) }
  safeMkdir(path)
  function mkChild(node: OutputContentNode, path: string) {
    const p = join(path, node.name)
    if (node.isDir) {
      safeMkdir(p)
      node.children.forEach(c => mkChild(c, p))
    } else {
      const fileValue = node.content.file;
      if (!fileValue) {
        throw new Error(`File exptected to have value ${node.name}`)
      }
      const textFileExt = ["md"]
      if (textFileExt.some(c => node.content.name.endsWith(c))) {
        const text = fileValue.toString()
        writeFileSync(p, renameLinks(text, map))
      } else {
        writeFileSync(p, fileValue)
      }
    }
  }
  copy.children.forEach(c => mkChild(c, path))
}
