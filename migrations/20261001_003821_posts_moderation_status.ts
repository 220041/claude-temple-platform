import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_moderation_status" AS ENUM('approved', 'pending', 'rejected');
  CREATE TYPE "public"."enum__posts_v_version_moderation_status" AS ENUM('approved', 'pending', 'rejected');
  ALTER TABLE "posts" ADD COLUMN "moderation_status" "enum_posts_moderation_status" DEFAULT 'approved';
  ALTER TABLE "_posts_v" ADD COLUMN "version_moderation_status" "enum__posts_v_version_moderation_status" DEFAULT 'approved';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP COLUMN "moderation_status";
  ALTER TABLE "_posts_v" DROP COLUMN "version_moderation_status";
  DROP TYPE "public"."enum_posts_moderation_status";
  DROP TYPE "public"."enum__posts_v_version_moderation_status";`)
}
