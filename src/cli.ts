#!/usr/bin/env node

import { join } from 'path'
import { exit } from 'process'
import yargs from 'yargs'

const argv = yargs(process.argv).argv
import { listDirRecursive, mapToNewNames } from './main'
import { writeToFile } from './write-to-file'

const outputPath = argv.output as string
const entryPath = argv.entry as string
if (!outputPath || !entryPath) {
  console.log("Please provide the --entry and the --output arguments")
  exit(1)
}
const currentPath = process.cwd()
const contentNodes = listDirRecursive(join(currentPath, entryPath))
const output = mapToNewNames(contentNodes)
writeToFile(join(currentPath, outputPath), output)
