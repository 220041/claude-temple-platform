import { generateBoardListMetadata } from "@/lib/seo"
import BoardListPage from "@/components/board/board-list-page"

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  return <BoardListPage boardKey="community" basePath="/community" variant="list" page={Number(page) || 1} />
}

export async function generateMetadata() {
  return generateBoardListMetadata("community")
}
