import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_main_menu_utility_links_link_type" AS ENUM('page', 'board', 'url');
  CREATE TYPE "public"."enum__main_menu_v_version_utility_links_link_type" AS ENUM('page', 'board', 'url');
  CREATE TABLE "main_menu_utility_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_type" "enum_main_menu_utility_links_link_type" DEFAULT 'page',
  	"page_ref_id" integer,
  	"board_ref_id" integer,
  	"external_url" varchar
  );
  
  CREATE TABLE "_main_menu_v_version_utility_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_type" "enum__main_menu_v_version_utility_links_link_type" DEFAULT 'page',
  	"page_ref_id" integer,
  	"board_ref_id" integer,
  	"external_url" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "footer_settings" ADD COLUMN "tagline" varchar;
  ALTER TABLE "_footer_settings_v" ADD COLUMN "version_tagline" varchar;
  ALTER TABLE "main_menu_utility_links" ADD CONSTRAINT "main_menu_utility_links_page_ref_id_pages_id_fk" FOREIGN KEY ("page_ref_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_menu_utility_links" ADD CONSTRAINT "main_menu_utility_links_board_ref_id_boards_id_fk" FOREIGN KEY ("board_ref_id") REFERENCES "public"."boards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_menu_utility_links" ADD CONSTRAINT "main_menu_utility_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."main_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_main_menu_v_version_utility_links" ADD CONSTRAINT "_main_menu_v_version_utility_links_page_ref_id_pages_id_fk" FOREIGN KEY ("page_ref_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_main_menu_v_version_utility_links" ADD CONSTRAINT "_main_menu_v_version_utility_links_board_ref_id_boards_id_fk" FOREIGN KEY ("board_ref_id") REFERENCES "public"."boards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_main_menu_v_version_utility_links" ADD CONSTRAINT "_main_menu_v_version_utility_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_main_menu_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "main_menu_utility_links_order_idx" ON "main_menu_utility_links" USING btree ("_order");
  CREATE INDEX "main_menu_utility_links_parent_id_idx" ON "main_menu_utility_links" USING btree ("_parent_id");
  CREATE INDEX "main_menu_utility_links_page_ref_idx" ON "main_menu_utility_links" USING btree ("page_ref_id");
  CREATE INDEX "main_menu_utility_links_board_ref_idx" ON "main_menu_utility_links" USING btree ("board_ref_id");
  CREATE INDEX "_main_menu_v_version_utility_links_order_idx" ON "_main_menu_v_version_utility_links" USING btree ("_order");
  CREATE INDEX "_main_menu_v_version_utility_links_parent_id_idx" ON "_main_menu_v_version_utility_links" USING btree ("_parent_id");
  CREATE INDEX "_main_menu_v_version_utility_links_page_ref_idx" ON "_main_menu_v_version_utility_links" USING btree ("page_ref_id");
  CREATE INDEX "_main_menu_v_version_utility_links_board_ref_idx" ON "_main_menu_v_version_utility_links" USING btree ("board_ref_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "main_menu_utility_links" CASCADE;
  DROP TABLE "_main_menu_v_version_utility_links" CASCADE;
  ALTER TABLE "footer_settings" DROP COLUMN "tagline";
  ALTER TABLE "_footer_settings_v" DROP COLUMN "version_tagline";
  DROP TYPE "public"."enum_main_menu_utility_links_link_type";
  DROP TYPE "public"."enum__main_menu_v_version_utility_links_link_type";`)
}
