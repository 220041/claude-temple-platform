import { generatePostMetadata } from "@/lib/seo"
import BoardDetailPage from "@/components/board/board-detail-page"

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BoardDetailPage boardKey="notices" basePath="/notices" id={id} />
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return generatePostMetadata("notices", id)
}
