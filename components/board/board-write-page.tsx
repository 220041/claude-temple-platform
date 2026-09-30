import { notFound, redirect } from "next/navigation"
import SiteShell from "@/components/site-shell"
import PostForm from "./post-form"
import { getBoardByKey, getPostDetail } from "@/lib/boards"
import { getCurrentMemberCached } from "@/lib/memberAuth"

export default async function BoardWritePage({
  boardKey,
  basePath,
  editPostId,
}: {
  boardKey: string
  basePath: string
  editPostId?: string
}) {
  const [board, member] = await Promise.all([getBoardByKey(boardKey), getCurrentMemberCached()])
  if (!board?.allowMemberPost) notFound()
  if (!member) redirect(`/login`)

  let initial: { title: string; content: string; visibility?: string | null } | undefined
  if (editPostId) {
    const result = await getPostDetail(boardKey, editPostId)
    if (!result) notFound()
    const memberAuthorId =
      result.post.memberAuthor && typeof result.post.memberAuthor === "object"
        ? (result.post.memberAuthor as { id: unknown }).id
        : result.post.memberAuthor
    if (String(memberAuthorId) !== String(member.id)) notFound()
    initial = { title: result.post.title, content: result.post.content, visibility: result.post.visibility }
  }

  return (
    <SiteShell>
      <div className="max-w-[700px] mx-auto px-8" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
        <h1 className="font-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#161410", marginBottom: "32px" }}>
          {editPostId ? "게시물 수정" : `${board.displayName} 글쓰기`}
        </h1>
        <PostForm
          boardKey={boardKey}
          allowSecret={Boolean(board.allowSecret)}
          allowImages
          initial={initial}
          postId={editPostId}
        />
      </div>
    </SiteShell>
  )
}
