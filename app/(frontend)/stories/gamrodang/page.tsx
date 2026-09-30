import { generateBoardListMetadata } from "@/lib/seo"
import BoardListPage from "@/components/board/board-list-page"

export default async function GamrodangPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  return <BoardListPage boardKey="gamrodang" basePath="/stories/gamrodang" variant="list" page={Number(page) || 1} />
}

export async function generateMetadata() {
  return generateBoardListMetadata("gamrodang")
}
