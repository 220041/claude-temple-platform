import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "boards" ALTER COLUMN "board_key" SET DATA TYPE varchar;
  DROP TYPE "public"."enum_boards_board_key";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_boards_board_key" AS ENUM('notices', 'dharma', 'press', 'monk-gallery', 'scenery-gallery', 'community', 'stories', 'gamrodang');
  ALTER TABLE "boards" ALTER COLUMN "board_key" SET DATA TYPE "public"."enum_boards_board_key" USING "board_key"::"public"."enum_boards_board_key";`)
}
