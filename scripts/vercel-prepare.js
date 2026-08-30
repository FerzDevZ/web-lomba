#!/usr/bin/env node
// Auto-detect DATABASE_URL and switch Prisma schema for Vercel/local
const fs = require('fs')
const schemaPath = 'prisma/schema.prisma'
const lockPath = 'prisma/migrations/migration_lock.toml'
const mongoSchema = 'prisma/schema.mongo.prisma'
if (!fs.existsSync(schemaPath)) process.exit(0)
let url = (process.env.DATABASE_URL || '').trim()
// Fallback: baca .env jika process.env kosong (lokal)
if (!url && fs.existsSync('.env')) {
  try {
    const env = fs.readFileSync('.env', 'utf8')
    const m = env.match(/DATABASE_URL\s*=\s*["']?([^"'\n]+)["']?/)
    if (m) url = m[1].trim()
  } catch {}
}
url = url.replace(/^["']|["']$/g, '').trim()
const isPg = url.startsWith('postgres://') || url.startsWith('postgresql://')
const isMongo = url.startsWith('mongodb://') || url.startsWith('mongodb+srv://')
let content = fs.readFileSync(schemaPath, 'utf8')

if (isMongo && fs.existsSync(mongoSchema)) {
  console.log('[vercel-prepare] Switching to MongoDB schema')
  fs.copyFileSync(mongoSchema, schemaPath)
  if (fs.existsSync(lockPath)) {
    // Mongo does not use migration_lock.toml the same way, but keep as is
    console.log('[vercel-prepare] MongoDB: migrations are managed via db push')
  }
} else if (isPg && content.includes('provider = "sqlite"')) {
  console.log('[vercel-prepare] Switching Prisma provider to postgresql')
  content = content.replace('provider = "sqlite"', 'provider = "postgresql"')
  fs.writeFileSync(schemaPath, content)
  if (fs.existsSync(lockPath)) {
    let lock = fs.readFileSync(lockPath, 'utf8')
    lock = lock.replace('provider = "sqlite"', 'provider = "postgresql"')
    fs.writeFileSync(lockPath, lock)
    console.log('[vercel-prepare] Updated migration lock to postgresql')
  }
} else {
  console.log('[vercel-prepare] Provider unchanged (sqlite for local)')
}
