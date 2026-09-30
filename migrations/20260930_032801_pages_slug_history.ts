import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"changed_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_pages_v_version_slug_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"changed_at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages_slug_history" ADD CONSTRAINT "pages_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_slug_history" ADD CONSTRAINT "_pages_v_version_slug_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_slug_history_order_idx" ON "pages_slug_history" USING btree ("_order");
  CREATE INDEX "pages_slug_history_parent_id_idx" ON "pages_slug_history" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_slug_history_order_idx" ON "_pages_v_version_slug_history" USING btree ("_order");
  CREATE INDEX "_pages_v_version_slug_history_parent_id_idx" ON "_pages_v_version_slug_history" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_slug_history" CASCADE;
  DROP TABLE "_pages_v_version_slug_history" CASCADE;`)
}
