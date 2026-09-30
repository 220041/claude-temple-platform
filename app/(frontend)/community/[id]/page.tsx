import { generatePostMetadata } from "@/lib/seo"
import BoardDetailPage from "@/components/board/board-detail-page"

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BoardDetailPage boardKey="community" basePath="/community" id={id} />
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return generatePostMetadata("community", id)
}
