import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "installed" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "site_short_name" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "site_name_en" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "site_keywords" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "logo_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "logo_alt" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "theme_color" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "colors_accent" varchar DEFAULT '#9b6b3f';
  ALTER TABLE "site_settings" ADD COLUMN "colors_ink" varchar DEFAULT '#20251f';
  ALTER TABLE "site_settings" ADD COLUMN "colors_deep" varchar DEFAULT '#263328';
  ALTER TABLE "site_settings" ADD COLUMN "colors_pine" varchar DEFAULT '#405343';
  ALTER TABLE "site_settings" ADD COLUMN "colors_paper" varchar DEFAULT '#f5f1e8';
  ALTER TABLE "site_settings" ADD COLUMN "email_from_name" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "location_lat" numeric;
  ALTER TABLE "site_settings" ADD COLUMN "location_lng" numeric;
  ALTER TABLE "site_settings" ADD COLUMN "location_map_label" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "location_zoom_level" numeric DEFAULT 4;
  ALTER TABLE "home_page" ADD COLUMN "show_temple_intro" boolean DEFAULT true;
  ALTER TABLE "home_page" ADD COLUMN "show_monk_intro" boolean DEFAULT true;
  ALTER TABLE "home_page" ADD COLUMN "show_prayer_section" boolean DEFAULT true;
  ALTER TABLE "home_page" ADD COLUMN "show_location_section" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_public_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media_public"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_logo_id_media_public_id_fk";
  
  DROP INDEX "site_settings_logo_idx";
  ALTER TABLE "site_settings" DROP COLUMN "installed";
  ALTER TABLE "site_settings" DROP COLUMN "site_short_name";
  ALTER TABLE "site_settings" DROP COLUMN "site_name_en";
  ALTER TABLE "site_settings" DROP COLUMN "site_keywords";
  ALTER TABLE "site_settings" DROP COLUMN "logo_id";
  ALTER TABLE "site_settings" DROP COLUMN "logo_alt";
  ALTER TABLE "site_settings" DROP COLUMN "theme_color";
  ALTER TABLE "site_settings" DROP COLUMN "colors_accent";
  ALTER TABLE "site_settings" DROP COLUMN "colors_ink";
  ALTER TABLE "site_settings" DROP COLUMN "colors_deep";
  ALTER TABLE "site_settings" DROP COLUMN "colors_pine";
  ALTER TABLE "site_settings" DROP COLUMN "colors_paper";
  ALTER TABLE "site_settings" DROP COLUMN "email_from_name";
  ALTER TABLE "site_settings" DROP COLUMN "location_lat";
  ALTER TABLE "site_settings" DROP COLUMN "location_lng";
  ALTER TABLE "site_settings" DROP COLUMN "location_map_label";
  ALTER TABLE "site_settings" DROP COLUMN "location_zoom_level";
  ALTER TABLE "home_page" DROP COLUMN "show_temple_intro";
  ALTER TABLE "home_page" DROP COLUMN "show_monk_intro";
  ALTER TABLE "home_page" DROP COLUMN "show_prayer_section";
  ALTER TABLE "home_page" DROP COLUMN "show_location_section";`)
}
