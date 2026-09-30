import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_main_menu_items_children_link_type" AS ENUM('none', 'newPage', 'page', 'board', 'url');
  CREATE TYPE "public"."enum_main_menu_items_link_type" AS ENUM('none', 'newPage', 'page', 'board', 'url');
  CREATE TABLE "main_menu_items_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"visible" boolean DEFAULT true,
  	"show_in_top" boolean DEFAULT true,
  	"show_in_bottom" boolean DEFAULT true,
  	"link_type" "enum_main_menu_items_children_link_type" DEFAULT 'none',
  	"page_ref_id" integer,
  	"board_ref_id" integer,
  	"external_url" varchar
  );
  
  CREATE TABLE "main_menu_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"visible" boolean DEFAULT true,
  	"show_in_top" boolean DEFAULT true,
  	"show_in_bottom" boolean DEFAULT true,
  	"link_type" "enum_main_menu_items_link_type" DEFAULT 'none',
  	"page_ref_id" integer,
  	"board_ref_id" integer,
  	"external_url" varchar
  );
  
  CREATE TABLE "main_menu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "main_menu_items_children" ADD CONSTRAINT "main_menu_items_children_page_ref_id_pages_id_fk" FOREIGN KEY ("page_ref_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_menu_items_children" ADD CONSTRAINT "main_menu_items_children_board_ref_id_boards_id_fk" FOREIGN KEY ("board_ref_id") REFERENCES "public"."boards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_menu_items_children" ADD CONSTRAINT "main_menu_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."main_menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "main_menu_items" ADD CONSTRAINT "main_menu_items_page_ref_id_pages_id_fk" FOREIGN KEY ("page_ref_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_menu_items" ADD CONSTRAINT "main_menu_items_board_ref_id_boards_id_fk" FOREIGN KEY ("board_ref_id") REFERENCES "public"."boards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "main_menu_items" ADD CONSTRAINT "main_menu_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."main_menu"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "main_menu_items_children_order_idx" ON "main_menu_items_children" USING btree ("_order");
  CREATE INDEX "main_menu_items_children_parent_id_idx" ON "main_menu_items_children" USING btree ("_parent_id");
  CREATE INDEX "main_menu_items_children_page_ref_idx" ON "main_menu_items_children" USING btree ("page_ref_id");
  CREATE INDEX "main_menu_items_children_board_ref_idx" ON "main_menu_items_children" USING btree ("board_ref_id");
  CREATE INDEX "main_menu_items_order_idx" ON "main_menu_items" USING btree ("_order");
  CREATE INDEX "main_menu_items_parent_id_idx" ON "main_menu_items" USING btree ("_parent_id");
  CREATE INDEX "main_menu_items_page_ref_idx" ON "main_menu_items" USING btree ("page_ref_id");
  CREATE INDEX "main_menu_items_board_ref_idx" ON "main_menu_items" USING btree ("board_ref_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "main_menu_items_children" CASCADE;
  DROP TABLE "main_menu_items" CASCADE;
  DROP TABLE "main_menu" CASCADE;
  DROP TYPE "public"."enum_main_menu_items_children_link_type";
  DROP TYPE "public"."enum_main_menu_items_link_type";`)
}
