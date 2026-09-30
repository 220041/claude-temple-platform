import { notFound } from "next/navigation"
import SiteShell from "@/components/site-shell"
import PostDetail from "./post-detail"
import { getPostDetail, getCommentsForPost } from "@/lib/boards"
import { getCurrentMemberCached } from "@/lib/memberAuth"

export default async function BoardDetailPage({
  boardKey,
  basePath,
  id,
}: {
  boardKey: string
  basePath: string
  id: string
}) {
  const [result, member] = await Promise.all([getPostDetail(boardKey, id), getCurrentMemberCached()])

  if (!result) notFound()
  const { post } = result

  const comments = await getCommentsForPost(String(post.id))

  const memberAuthorId =
    post.memberAuthor && typeof post.memberAuthor === "object" ? (post.memberAuthor as { id: unknown }).id : post.memberAuthor
  const isOwner = Boolean(member) && post.authorType === "member" && String(memberAuthorId) === String(member?.id)

  // guide.md 7.2절: 게시판 기본 댓글 허용 여부 + 게시물별 재정의(commentPolicy)를 반영한다.
  const boardAllows = result.board.allowPerPostCommentToggle
    ? post.commentPolicy !== "blocked"
    : Boolean(result.board.defaultAllowComments)
  const commentsAllowed = boardAllows && post.commentPolicy !== "blocked"

  return (
    <SiteShell>
      <PostDetail
        post={post}
        comments={comments}
        boardKey={boardKey}
        basePath={basePath}
        currentMemberId={member?.id}
        isOwner={isOwner}
        commentsAllowed={commentsAllowed}
      />
    </SiteShell>
  )
}
