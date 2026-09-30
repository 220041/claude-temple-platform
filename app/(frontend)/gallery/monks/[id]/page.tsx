import { generatePostMetadata } from "@/lib/seo"
import BoardDetailPage from "@/components/board/board-detail-page"

export default async function MonkGalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BoardDetailPage boardKey="monk-gallery" basePath="/gallery/monks" id={id} />
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return generatePostMetadata("monk-gallery", id)
}
