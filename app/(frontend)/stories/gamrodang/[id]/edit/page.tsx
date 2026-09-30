import BoardWritePage from "@/components/board/board-write-page"

export default async function GamrodangEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BoardWritePage boardKey="gamrodang" basePath="/stories/gamrodang" editPostId={id} />
}
