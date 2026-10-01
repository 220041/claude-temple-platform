import { notFound } from "next/navigation"
import { generatePostMetadata } from "@/lib/seo"
import BoardDetailPage from "@/components/board/board-detail-page"
import { isLegacyBoardKey } from "@/lib/boards"

export default async function DynamicBoardDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  if (isLegacyBoardKey(slug)) notFound()
  return <BoardDetailPage boardKey={slug} basePath={`/boards/${slug}`} id={id} />
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  if (isLegacyBoardKey(slug)) return {}
  return generatePostMetadata(slug, id)
}
