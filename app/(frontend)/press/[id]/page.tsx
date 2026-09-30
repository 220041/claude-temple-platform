import { generatePostMetadata } from "@/lib/seo"
import BoardDetailPage from "@/components/board/board-detail-page"

export default async function PressDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BoardDetailPage boardKey="press" basePath="/press" id={id} />
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return generatePostMetadata("press", id)
}
