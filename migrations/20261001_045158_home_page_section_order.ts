import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_page_section_order_section" AS ENUM('templeIntro', 'prayer', 'location');
  CREATE TABLE "home_page_section_order" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section" "enum_home_page_section_order_section" NOT NULL
  );
  
  ALTER TABLE "home_page_section_order" ADD CONSTRAINT "home_page_section_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_section_order_order_idx" ON "home_page_section_order" USING btree ("_order");
  CREATE INDEX "home_page_section_order_parent_id_idx" ON "home_page_section_order" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_page_section_order" CASCADE;
  DROP TYPE "public"."enum_home_page_section_order_section";`)
}
