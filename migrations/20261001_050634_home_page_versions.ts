import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_page_v_version_section_order_section" AS ENUM('templeIntro', 'prayer', 'location');
  CREATE TYPE "public"."enum__home_page_v_version_prayer_cards_icon" AS ENUM('calendar', 'heart', 'users');
  CREATE TYPE "public"."enum__home_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_home_page_v_version_section_order" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"section" "enum__home_page_v_version_section_order_section",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_main_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"title" varchar,
  	"subtitle" varchar,
  	"description" varchar,
  	"link_url" varchar,
  	"enabled" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_prayer_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"link_url" varchar,
  	"icon" "enum__home_page_v_version_prayer_cards_icon" DEFAULT 'calendar',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_show_temple_intro" boolean DEFAULT true,
  	"version_show_monk_intro" boolean DEFAULT true,
  	"version_show_prayer_section" boolean DEFAULT true,
  	"version_show_location_section" boolean DEFAULT true,
  	"version_temple_news_display_count" numeric DEFAULT 7,
  	"version_temple_intro_title" varchar,
  	"version_temple_intro_summary" varchar,
  	"version_temple_intro_image_id" integer,
  	"version_temple_intro_link_url" varchar,
  	"version_monk_intro_title" varchar,
  	"version_monk_intro_summary" varchar,
  	"version_monk_intro_image_id" integer,
  	"version_monk_intro_link_url" varchar,
  	"version__status" "enum__home_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "home_page_section_order" ALTER COLUMN "section" DROP NOT NULL;
  ALTER TABLE "home_page_main_slides" ALTER COLUMN "image_id" DROP NOT NULL;
  ALTER TABLE "home_page_main_slides" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "home_page_prayer_cards" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "home_page" ADD COLUMN "_status" "enum_home_page_status" DEFAULT 'draft';
  ALTER TABLE "_home_page_v_version_section_order" ADD CONSTRAINT "_home_page_v_version_section_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_main_slides" ADD CONSTRAINT "_home_page_v_version_main_slides_image_id_media_public_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_public"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_main_slides" ADD CONSTRAINT "_home_page_v_version_main_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_prayer_cards" ADD CONSTRAINT "_home_page_v_version_prayer_cards_image_id_media_public_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_public"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_prayer_cards" ADD CONSTRAINT "_home_page_v_version_prayer_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_temple_intro_image_id_media_public_id_fk" FOREIGN KEY ("version_temple_intro_image_id") REFERENCES "public"."media_public"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_monk_intro_image_id_media_public_id_fk" FOREIGN KEY ("version_monk_intro_image_id") REFERENCES "public"."media_public"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_home_page_v_version_section_order_order_idx" ON "_home_page_v_version_section_order" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_section_order_parent_id_idx" ON "_home_page_v_version_section_order" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_main_slides_order_idx" ON "_home_page_v_version_main_slides" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_main_slides_parent_id_idx" ON "_home_page_v_version_main_slides" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_main_slides_image_idx" ON "_home_page_v_version_main_slides" USING btree ("image_id");
  CREATE INDEX "_home_page_v_version_prayer_cards_order_idx" ON "_home_page_v_version_prayer_cards" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_prayer_cards_parent_id_idx" ON "_home_page_v_version_prayer_cards" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_prayer_cards_image_idx" ON "_home_page_v_version_prayer_cards" USING btree ("image_id");
  CREATE INDEX "_home_page_v_version_temple_intro_version_temple_intro_i_idx" ON "_home_page_v" USING btree ("version_temple_intro_image_id");
  CREATE INDEX "_home_page_v_version_monk_intro_version_monk_intro_image_idx" ON "_home_page_v" USING btree ("version_monk_intro_image_id");
  CREATE INDEX "_home_page_v_version_version__status_idx" ON "_home_page_v" USING btree ("version__status");
  CREATE INDEX "_home_page_v_created_at_idx" ON "_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "_home_page_v" USING btree ("updated_at");
  CREATE INDEX "_home_page_v_latest_idx" ON "_home_page_v" USING btree ("latest");
  CREATE INDEX "home_page__status_idx" ON "home_page" USING btree ("_status");`)

  // 새로 추가된 _status 컬럼의 기본값은 'draft'라, 이미 공개 중이던
  // 콘텐츠가 그대로인데도 관리자 화면엔 "Draft"로 표시되는 불일치가
  // 생긴다(migrations/20260929_000000_backfill_page_versions.ts의
  // Pages 선례와 동일한 문제). 현재 내용을 그대로 "발행"해 _status를
  // 바로잡고 버전 이력의 첫 항목(복원 가능한 published 버전)을 만든다.
  await payload.updateGlobal({
    slug: 'home-page',
    data: { _status: 'published' },
    overrideAccess: true,
    req,
  })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_home_page_v_version_section_order" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_main_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_prayer_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_home_page_v_version_section_order" CASCADE;
  DROP TABLE "_home_page_v_version_main_slides" CASCADE;
  DROP TABLE "_home_page_v_version_prayer_cards" CASCADE;
  DROP TABLE "_home_page_v" CASCADE;
  DROP INDEX "home_page__status_idx";
  ALTER TABLE "home_page_section_order" ALTER COLUMN "section" SET NOT NULL;
  ALTER TABLE "home_page_main_slides" ALTER COLUMN "image_id" SET NOT NULL;
  ALTER TABLE "home_page_main_slides" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "home_page_prayer_cards" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "home_page" DROP COLUMN "_status";
  DROP TYPE "public"."enum_home_page_status";
  DROP TYPE "public"."enum__home_page_v_version_section_order_section";
  DROP TYPE "public"."enum__home_page_v_version_prayer_cards_icon";
  DROP TYPE "public"."enum__home_page_v_version_status";`)
}
