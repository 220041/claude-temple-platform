import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_boards_board_type" AS ENUM('notice', 'general', 'gallery');
  CREATE TYPE "public"."enum_boards_member_post_approval" AS ENUM('immediate', 'requiresApproval');
  ALTER TABLE "boards" ADD COLUMN "board_type" "enum_boards_board_type" DEFAULT 'general';
  ALTER TABLE "boards" ADD COLUMN "member_post_approval" "enum_boards_member_post_approval" DEFAULT 'immediate';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "boards" DROP COLUMN "board_type";
  ALTER TABLE "boards" DROP COLUMN "member_post_approval";
  DROP TYPE "public"."enum_boards_board_type";
  DROP TYPE "public"."enum_boards_member_post_approval";`)
}
