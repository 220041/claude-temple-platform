import BoardWritePage from "@/components/board/board-write-page"

export default async function CommunityEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BoardWritePage boardKey="community" basePath="/community" editPostId={id} />
}
