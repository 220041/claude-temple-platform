import BoardWritePage from "@/components/board/board-write-page"

export default async function SceneryGalleryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BoardWritePage boardKey="scenery-gallery" basePath="/gallery/scenery" editPostId={id} />
}
