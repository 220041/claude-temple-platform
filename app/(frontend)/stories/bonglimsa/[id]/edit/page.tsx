import BoardWritePage from "@/components/board/board-write-page"

export default async function StoriesEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BoardWritePage boardKey="stories" basePath="/stories/bonglimsa" editPostId={id} />
}
