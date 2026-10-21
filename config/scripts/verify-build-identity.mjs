#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { extractFile, listPackage } from '@electron/asar'
import {
  BUILD_IDENTITY_RE,
  MINIFIED_BUILD_IDENTITY_RE
} from './build-identity-patterns.mjs'

function findAsar(rootDir) {
  const matches = []
  const stack = [rootDir]
  while (stack.length > 0) {
    const dir = stack.pop()
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
      } else if (entry.isFile() && entry.name === 'app.asar') {
        matches.push(fullPath)
      }
    }
  }
  return matches
}

const distDir = process.argv[2] ?? 'dist'
if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
  console.error(`::error::dist directory not found at ${distDir}`)
  process.exit(1)
}

const asarMatches = findAsar(distDir)
if (asarMatches.length === 0) {
  console.error(`::error::could not locate app.asar under ${distDir}`)
  process.exit(1)
}

function verifyAsar(asarPath) {
  const mainJsEntries = listPackage(asarPath).filter((entry) => {
    const normalized = entry.replace(/\\/g, '/').replace(/^\/+/, '')
    return normalized.startsWith('out/main/') && normalized.endsWith('.js')
  })
  if (mainJsEntries.length === 0) {
    console.error(`::error::no .js files found under out/main/ in ${asarPath}`)
    return null
  }

  const mainJs = mainJsEntries
    .map((entry) => extractFile(asarPath, entry.replace(/^[\\/]+/, '')).toString('utf8'))
    .join('\n')
  const identity =
    BUILD_IDENTITY_RE.exec(mainJs)?.[1] ?? MINIFIED_BUILD_IDENTITY_RE.exec(mainJs)?.[1]
  if (!identity) {
    console.error(`::error::BUILD_IDENTITY constant missing or unexpected value in ${asarPath}`)
    return null
  }
  return { asarPath, identity }
}

const results = asarMatches.map(verifyAsar)
if (results.some((result) => result === null)) {
  process.exit(1)
}

const identities = new Set(results.map((result) => result.identity))
if (identities.size > 1) {
  console.error(`::error::asars disagree on BUILD_IDENTITY: ${[...identities].join(', ')}`)
  for (const result of results) {
    console.error(`  - ${result.asarPath}: ${result.identity}`)
  }
  process.exit(1)
}

console.log(`Build identity verified across ${results.length} asar(s): "${results[0].identity}"`)
