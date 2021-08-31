import { rmSync, copySync } from 'fs-extra'
import { join, basename } from 'path'
import { listDirRecursive, ContentNode, ContentRoot, printStruct, mapToNewNames, OutputContentRoot, OutputContentNode, normalizeOutputAsMap } from './main'
import { writeToFile } from './write-to-file'

const withFolderPath = (id: string) => join(__dirname, `temp-notion-example-export-${id}`)

const exportName = "Export-92664457-ad74-4e22-9136-452bbfb8657c"
const exampleExportPath = join(__dirname, "..", "examples", exportName)

let currentPath = ""
function setup() {
  const id = String(Math.random() * 10000)
  const path = withFolderPath(id)
  copySync(exampleExportPath, path)
  currentPath = path

  return path
}

function clear(path: string) {
  rmSync(path, { recursive: true, force: true })
}

function dirOf(name: string, children: Array<ContentNode> = []): ContentNode {
  return { isDir: true, name, children, }
}

function fileOf(name: string): ContentNode {
  return { isDir: false, name, children: [] }
}

const folderOutputOf = (name: string, content: ContentNode, children: Array<OutputContentNode>): OutputContentNode => {
  return {
    name,
    content,
    children,
    isDir: true
  }
}

const fileOutputOf = (name: string, content: ContentNode): OutputContentNode => {
  return {
    name,
    content,
    children: [],
    isDir: false
  }
}


const expected = (path: string): ContentRoot => ({
  name: basename(path),
  children: [
    dirOf("Portugues 31fb904387814de6acd73951dd7e2b2c", [
      dirOf("Assuntos e conceitos 67bb3e814f3e42bdabb8c1437af88962", [
        dirOf("Acusativo 36539644492b44b6bc6da64a031584e4", [fileOf("Untitled.png")]),
        fileOf("Acusativo 36539644492b44b6bc6da64a031584e4.md"),
        dirOf("Adjunto Adverbial 13aafa90aef141e3a822bca744c9f0fe", [fileOf("Untitled.png")]),
        fileOf("Adjunto Adverbial 13aafa90aef141e3a822bca744c9f0fe.md"),
      ]),
      fileOf("Assuntos e conceitos 67bb3e814f3e42bdabb8c1437af88962.csv"),
      dirOf("Palavras d305bb1befb64ce783e427bc20d614eb", [
        fileOf("Alva 2cde60af54c242a9bd66747d132cdf22.md"),
        fileOf("Urbe b64a2297b60b4d7d9f4e798d55db5232.md"),
        fileOf("Verdor 3cc68ef763ec4d829ea6321f5b563df3.md"),
      ]),
      fileOf("Palavras d305bb1befb64ce783e427bc20d614eb.csv"),
    ]),
    fileOf("Portugues 31fb904387814de6acd73951dd7e2b2c.md"),
  ]
})

test('list dir recursive test', () => {
  const path = setup()

  const root = listDirRecursive(path)
  const expectedTree = expected(path)

  expect(printStruct(root)).toEqual(printStruct(expectedTree))
});


it("normalizes the names of the files", () => {
  const path = setup()
  const root = listDirRecursive(path)
  const res = mapToNewNames(root)

  const map = normalizeOutputAsMap(res);

  function findContentByName(name: string): ContentNode {
    const value = map.get(name)
    if (value) {
      return value.content as ContentNode
    } else {
      throw new Error(`No content with name ${name} found`)

    }
  }

  const tree = expected(path)
  const base = basename(path)
  const expectedResult: OutputContentRoot = {
    content: tree,
    name: base,
    children: [
      folderOutputOf("portugues", findContentByName(`${base}/portugues`), [
        folderOutputOf("assuntos_e_conceitos", findContentByName(`${base}/portugues/assuntos_e_conceitos`), [
          folderOutputOf("acusativo", findContentByName(`${base}/portugues/assuntos_e_conceitos/acusativo`), [
            fileOutputOf("untitled.png", findContentByName(`${base}/portugues/assuntos_e_conceitos/acusativo/untitled.png`))
          ]),
          fileOutputOf("acusativo.md", findContentByName(`${base}/portugues/assuntos_e_conceitos/acusativo.md`)),
          folderOutputOf("adjunto_adverbial", findContentByName(`${base}/portugues/assuntos_e_conceitos/adjunto_adverbial`), [
            fileOutputOf("untitled.png", findContentByName(`${base}/portugues/assuntos_e_conceitos/adjunto_adverbial/untitled.png`))
          ]),
          fileOutputOf("adjunto_adverbial.md", findContentByName(`${base}/portugues/assuntos_e_conceitos/adjunto_adverbial.md`)),
        ]),
        fileOutputOf("assuntos_e_conceitos.csv", tree.children[0].children[1]),
        folderOutputOf("palavras", tree.children[0].children[2], [
          fileOutputOf("alva.md", tree.children[0].children[2].children[0]),
          fileOutputOf("urbe.md", tree.children[0].children[2].children[1]),
          fileOutputOf("verdor.md", tree.children[0].children[2].children[2]),
        ]),
        fileOutputOf("palavras.csv", tree.children[0].children[3]),
      ]),
      fileOutputOf("portugues.md", tree.children[1])
    ]
  };

  expect(printStruct(expectedResult)).toEqual(printStruct(res))

  const p = `output-${Math.random() * 10000000}`
  const folderPath = join(__dirname, p)
  try {
    writeToFile(folderPath, res)
  } finally {
    rmSync(folderPath, { recursive: true, force: true })
  }

})


afterEach(() => {
  clear(currentPath)
})
