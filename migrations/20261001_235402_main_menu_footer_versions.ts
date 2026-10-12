import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_footer_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__footer_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_main_menu_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__main_menu_v_version_items_children_link_type" AS ENUM('none', 'newPage', 'page', 'board', 'url');
  CREATE TYPE "public"."enum__main_menu_v_version_items_link_type" AS ENUM('none', 'newPage', 'page', 'board', 'url');
  CREATE TYPE "public"."enum__main_menu_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_footer_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_address" varchar,
  	"version_phone" varchar,
  	"version_fax" varchar,
  	"version_email" varchar,
  	"version_copyright_text" varchar,
  	"version__status" "enum__footer_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_main_menu_v_version_items_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"visible" boolean DEFAULT true,
  	"show_in_top" boolean DEFAULT true,
  	"show_in_bottom" boolean DEFAULT true,
  	"link_type" "enum__main_menu_v_version_items_children_link_type" DEFAULT 'none',
  	"page_ref_id" integer,
  	"board_ref_id" integer,
  	"external_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_main_menu_v_version_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"visible" boolean DEFAULT true,
  	"show_in_top" boolean DEFAULT true,
  	"show_in_bottom" boolean DEFAULT true,
  	"link_type" "enum__main_menu_v_version_items_link_type" DEFAULT 'none',
  	"page_ref_id" integer,
  	"board_ref_id" integer,
  	"external_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_main_menu_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__main_menu_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "main_menu_items_children" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "main_menu_items" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "footer_settings" ADD COLUMN "_status" "enum_footer_settings_status" DEFAULT 'draft';
  ALTER TABLE "main_menu" ADD COLUMN "_status" "enum_main_menu_status" DEFAULT 'draft';
  ALTER TABLE "_main_menu_v_version_items_children" ADD CONSTRAINT "_main_menu_v_version_items_children_page_ref_id_pages_id_fk" FOREIGN KEY ("page_ref_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_main_menu_v_version_items_children" ADD CONSTRAINT "_main_menu_v_version_items_children_board_ref_id_boards_id_fk" FOREIGN KEY ("board_ref_id") REFERENCES "public"."boards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_main_menu_v_version_items_children" ADD CONSTRAINT "_main_menu_v_version_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_main_menu_v_version_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_main_menu_v_version_items" ADD CONSTRAINT "_main_menu_v_version_items_page_ref_id_pages_id_fk" FOREIGN KEY ("page_ref_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_main_menu_v_version_items" ADD CONSTRAINT "_main_menu_v_version_items_board_ref_id_boards_id_fk" FOREIGN KEY ("board_ref_id") REFERENCES "public"."boards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_main_menu_v_version_items" ADD CONSTRAINT "_main_menu_v_version_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_main_menu_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_footer_settings_v_version_version__status_idx" ON "_footer_settings_v" USING btree ("version__status");
  CREATE INDEX "_footer_settings_v_created_at_idx" ON "_footer_settings_v" USING btree ("created_at");
  CREATE INDEX "_footer_settings_v_updated_at_idx" ON "_footer_settings_v" USING btree ("updated_at");
  CREATE INDEX "_footer_settings_v_latest_idx" ON "_footer_settings_v" USING btree ("latest");
  CREATE INDEX "_main_menu_v_version_items_children_order_idx" ON "_main_menu_v_version_items_children" USING btree ("_order");
  CREATE INDEX "_main_menu_v_version_items_children_parent_id_idx" ON "_main_menu_v_version_items_children" USING btree ("_parent_id");
  CREATE INDEX "_main_menu_v_version_items_children_page_ref_idx" ON "_main_menu_v_version_items_children" USING btree ("page_ref_id");
  CREATE INDEX "_main_menu_v_version_items_children_board_ref_idx" ON "_main_menu_v_version_items_children" USING btree ("board_ref_id");
  CREATE INDEX "_main_menu_v_version_items_order_idx" ON "_main_menu_v_version_items" USING btree ("_order");
  CREATE INDEX "_main_menu_v_version_items_parent_id_idx" ON "_main_menu_v_version_items" USING btree ("_parent_id");
  CREATE INDEX "_main_menu_v_version_items_page_ref_idx" ON "_main_menu_v_version_items" USING btree ("page_ref_id");
  CREATE INDEX "_main_menu_v_version_items_board_ref_idx" ON "_main_menu_v_version_items" USING btree ("board_ref_id");
  CREATE INDEX "_main_menu_v_version_version__status_idx" ON "_main_menu_v" USING btree ("version__status");
  CREATE INDEX "_main_menu_v_created_at_idx" ON "_main_menu_v" USING btree ("created_at");
  CREATE INDEX "_main_menu_v_updated_at_idx" ON "_main_menu_v" USING btree ("updated_at");
  CREATE INDEX "_main_menu_v_latest_idx" ON "_main_menu_v" USING btree ("latest");
  CREATE INDEX "footer_settings__status_idx" ON "footer_settings" USING btree ("_status");
  CREATE INDEX "main_menu__status_idx" ON "main_menu" USING btree ("_status");`)

  // 새 _status 컬럼 기본값이 'draft'라 이미 공개 중인 메뉴/푸터가 "Draft"로
  // 보이는 불일치를 막기 위해 현재 내용을 그대로 발행 상태로 만든다.
  // payload.updateGlobal(API)을 쓰면 안 된다 — API는 "현재 코드의 전체 스키마"를
  // 조회하는데, 그 안에는 이후 마이그레이션(utility_links)이 만들 테이블이 이미
  // 들어 있어 빈 신규 DB에서 아직 없는 테이블을 조회하다 실패한다. 그래서 원시 SQL로
  // 한다(행이 없는 빈 DB에서는 발행 상태의 행을 만든다). 버전 이력은 첫 저장 때 생긴다.
  await db.execute(sql`
   INSERT INTO "main_menu" ("_status") SELECT 'published' WHERE NOT EXISTS (SELECT 1 FROM "main_menu");
  INSERT INTO "footer_settings" ("_status") SELECT 'published' WHERE NOT EXISTS (SELECT 1 FROM "footer_settings");
  UPDATE "main_menu" SET "_status" = 'published';
  UPDATE "footer_settings" SET "_status" = 'published';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_footer_settings_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_main_menu_v_version_items_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_main_menu_v_version_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_main_menu_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_footer_settings_v" CASCADE;
  DROP TABLE "_main_menu_v_version_items_children" CASCADE;
  DROP TABLE "_main_menu_v_version_items" CASCADE;
  DROP TABLE "_main_menu_v" CASCADE;
  DROP INDEX "footer_settings__status_idx";
  DROP INDEX "main_menu__status_idx";
  ALTER TABLE "main_menu_items_children" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "main_menu_items" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "footer_settings" DROP COLUMN "_status";
  ALTER TABLE "main_menu" DROP COLUMN "_status";
  DROP TYPE "public"."enum_footer_settings_status";
  DROP TYPE "public"."enum__footer_settings_v_version_status";
  DROP TYPE "public"."enum_main_menu_status";
  DROP TYPE "public"."enum__main_menu_v_version_items_children_link_type";
  DROP TYPE "public"."enum__main_menu_v_version_items_link_type";
  DROP TYPE "public"."enum__main_menu_v_version_status";`)
}
