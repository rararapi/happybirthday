import { cp, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const source = resolve(root, 'encrypt')
const target = resolve(root, 'dist', 'encrypt')

await mkdir(resolve(root, 'dist'), { recursive: true })
await cp(source, target, { recursive: true, force: true })
