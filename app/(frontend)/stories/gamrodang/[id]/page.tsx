import { generatePostMetadata } from "@/lib/seo"
import BoardDetailPage from "@/components/board/board-detail-page"

export default async function GamrodangDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BoardDetailPage boardKey="gamrodang" basePath="/stories/gamrodang" id={id} />
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return generatePostMetadata("gamrodang", id)
}
