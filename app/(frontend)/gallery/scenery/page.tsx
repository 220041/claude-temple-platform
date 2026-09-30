import { generateBoardListMetadata } from "@/lib/seo"
import BoardListPage from "@/components/board/board-list-page"

export default async function SceneryGalleryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  return <BoardListPage boardKey="scenery-gallery" basePath="/gallery/scenery" variant="gallery" page={Number(page) || 1} />
}

export async function generateMetadata() {
  return generateBoardListMetadata("scenery-gallery")
}
