import { generateBoardListMetadata } from "@/lib/seo"
import BoardListPage from "@/components/board/board-list-page"

export default async function MonkGalleryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  return <BoardListPage boardKey="monk-gallery" basePath="/gallery/monks" variant="gallery" page={Number(page) || 1} />
}

export async function generateMetadata() {
  return generateBoardListMetadata("monk-gallery")
}
