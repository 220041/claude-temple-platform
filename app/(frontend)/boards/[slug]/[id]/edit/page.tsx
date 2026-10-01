import { notFound } from "next/navigation"
import BoardWritePage from "@/components/board/board-write-page"
import { isLegacyBoardKey } from "@/lib/boards"

export default async function DynamicBoardEditPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  if (isLegacyBoardKey(slug)) notFound()
  return <BoardWritePage boardKey={slug} basePath={`/boards/${slug}`} editPostId={id} />
}
