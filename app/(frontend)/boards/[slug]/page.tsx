import { notFound } from "next/navigation"
import { generateBoardListMetadata } from "@/lib/seo"
import BoardListPage from "@/components/board/board-list-page"
import { getBoardByKey, isLegacyBoardKey } from "@/lib/boards"

export default async function DynamicBoardListPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page } = await searchParams
  if (isLegacyBoardKey(slug)) notFound()

  const board = await getBoardByKey(slug)
  if (!board) notFound()

  const variant = board.boardType === "gallery" ? "gallery" : "list"
  return <BoardListPage boardKey={slug} basePath={`/boards/${slug}`} variant={variant} page={Number(page) || 1} />
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (isLegacyBoardKey(slug)) return {}
  return generateBoardListMetadata(slug)
}
