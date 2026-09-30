import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import SiteShell from "@/components/site-shell"
import { getCurrentMember } from "@/lib/memberAuth"
import { getMyComments, pathForBoardKey } from "@/lib/boards"
import type { Board, Post } from "@/payload-types"

export const metadata: Metadata = { title: "내가 쓴 댓글 | 하논봉림사", robots: { index: false, follow: false } }

export default async function MyCommentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const { page: pageParam } = await searchParams
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1
  const { comments, totalPages, totalDocs } = await getMyComments(member.id, page)

  return (
    <SiteShell>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "64px 24px" }}>
        <h1 className="font-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#161410", marginBottom: "8px" }}>
          내가 쓴 댓글
        </h1>
        <p className="font-sans" style={{ fontSize: "13px", color: "#888078", marginBottom: "24px" }}>총 {totalDocs}건</p>

        {comments.length === 0 ? (
          <p className="font-sans" style={{ color: "#888078", fontSize: "14px" }}>작성한 댓글이 없습니다.</p>
        ) : (
          <ul className="font-sans" style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e1d8" }}>
            {comments.map((comment) => {
              const post = comment.post as Post
              const board = post?.board as Board | undefined
              return (
                <li key={comment.id} style={{ background: "#fff", padding: "14px 16px" }}>
                  {board && post ? (
                    <Link href={`${pathForBoardKey(board.boardKey)}/${post.id}`} style={{ color: "#161410", fontSize: "14px" }}>
                      {comment.content}
                    </Link>
                  ) : (
                    <span style={{ fontSize: "14px", color: "#888078" }}>{comment.content} (원글 삭제됨)</span>
                  )}
                  <div style={{ fontSize: "12px", color: "#888078", marginTop: "4px" }}>
                    {board?.displayName ?? "-"} · {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "24px" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/mypage/comments?page=${p}`}
                className="font-sans"
                style={{ fontSize: "13px", color: p === page ? "#161410" : "#888078", fontWeight: p === page ? 700 : 400 }}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  )
}
