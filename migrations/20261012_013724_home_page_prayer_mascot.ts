import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" ADD COLUMN "prayer_mascot_id" integer;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_prayer_mascot_id" integer;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_prayer_mascot_id_media_public_id_fk" FOREIGN KEY ("prayer_mascot_id") REFERENCES "public"."media_public"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_prayer_mascot_id_media_public_id_fk" FOREIGN KEY ("version_prayer_mascot_id") REFERENCES "public"."media_public"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_page_prayer_mascot_idx" ON "home_page" USING btree ("prayer_mascot_id");
  CREATE INDEX "_home_page_v_version_version_prayer_mascot_idx" ON "_home_page_v" USING btree ("version_prayer_mascot_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" DROP CONSTRAINT "home_page_prayer_mascot_id_media_public_id_fk";
  
  ALTER TABLE "_home_page_v" DROP CONSTRAINT "_home_page_v_version_prayer_mascot_id_media_public_id_fk";
  
  DROP INDEX "home_page_prayer_mascot_idx";
  DROP INDEX "_home_page_v_version_version_prayer_mascot_idx";
  ALTER TABLE "home_page" DROP COLUMN "prayer_mascot_id";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_prayer_mascot_id";`)
}
