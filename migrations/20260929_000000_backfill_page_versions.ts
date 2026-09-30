import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Some Pages have rows in pages but none in _pages_v. Payload's admin list
 * queries with draft: true, which reads the
 * version table, so those pages disappear from the list.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const { rows } = await db.execute(sql`
    SELECT p.id, p.updated_at AS "updatedAt"
    FROM pages p
    WHERE NOT EXISTS (
      SELECT 1 FROM _pages_v v WHERE v.parent_id = p.id
    )
    ORDER BY p.id
  `)
  const pages = rows as Array<{ id: number; updatedAt: Date }>

  for (const page of pages) {
    const existing = await payload.findByID({
      collection: 'pages',
      id: page.id,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (existing._status !== 'published') {
      throw new Error(`Page ${page.id} has no version and is not published`)
    }

    // A published update writes the full document and its blocks to _pages_v.
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: { _status: 'published' },
      depth: 0,
      overrideAccess: true,
      req,
    })

    const { rows: versionRows } = await db.execute(sql`
      SELECT id FROM _pages_v
      WHERE parent_id = ${page.id}
        AND latest = true
        AND version__status = 'published'
      LIMIT 1
    `)
    if (versionRows.length === 0) {
      throw new Error(`Failed to create a version for page ${page.id}`)
    }

    // Repairing history must not make old content appear recently edited.
    await db.execute(sql`
      UPDATE pages SET updated_at = ${page.updatedAt} WHERE id = ${page.id}
    `)
  }
}

// Versions may be edited after this migration. Removing them on rollback would
// discard editorial history, so this data repair is intentionally irreversible.
export async function down(_args: MigrateDownArgs): Promise<void> {}
