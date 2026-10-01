import { notFound } from "next/navigation"
import BoardWritePage from "@/components/board/board-write-page"
import { isLegacyBoardKey } from "@/lib/boards"

export default async function DynamicBoardWritePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (isLegacyBoardKey(slug)) notFound()
  return <BoardWritePage boardKey={slug} basePath={`/boards/${slug}`} />
}
