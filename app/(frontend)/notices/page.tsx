import { generateBoardListMetadata } from "@/lib/seo"
import BoardListPage from "@/components/board/board-list-page"

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  return <BoardListPage boardKey="notices" basePath="/notices" variant="list" page={Number(page) || 1} />
}

export async function generateMetadata() {
  return generateBoardListMetadata("notices")
}
