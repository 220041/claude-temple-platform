import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "logo_tagline" varchar;`)

  // 이전 백필(20260930_030000)이 이미 실행된 인스턴스는 여기서 태그라인만
  // 마저 채운다. 아직 백필 전이라면(installed=false) 손대지 않는다.
  await db.execute(sql`
    UPDATE "site_settings" SET "logo_tagline" = '하논에 깃든 사찰' WHERE "installed" = true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "logo_tagline";`)
}
