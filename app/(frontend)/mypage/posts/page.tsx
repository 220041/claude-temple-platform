import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import SiteShell from "@/components/site-shell"
import { getCurrentMember } from "@/lib/memberAuth"
import { getMyPosts, pathForBoardKey } from "@/lib/boards"
import type { Board } from "@/payload-types"

export const metadata: Metadata = { title: "내가 쓴 글 | 하논봉림사", robots: { index: false, follow: false } }

export default async function MyPostsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const { page: pageParam } = await searchParams
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1
  const { posts, totalPages, totalDocs } = await getMyPosts(member.id, page)

  return (
    <SiteShell>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "64px 24px" }}>
        <h1 className="font-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#161410", marginBottom: "8px" }}>
          내가 쓴 글
        </h1>
        <p className="font-sans" style={{ fontSize: "13px", color: "#888078", marginBottom: "24px" }}>총 {totalDocs}건</p>

        {posts.length === 0 ? (
          <p className="font-sans" style={{ color: "#888078", fontSize: "14px" }}>작성한 게시물이 없습니다.</p>
        ) : (
          <ul className="font-sans" style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e1d8" }}>
            {posts.map((post) => {
              const board = post.board as Board
              return (
                <li key={post.id} style={{ background: "#fff", padding: "14px 16px" }}>
                  <Link href={`${pathForBoardKey(board.boardKey)}/${post.id}`} style={{ color: "#161410", fontSize: "14px" }}>
                    {post.visibility === "secret" ? "🔒 " : ""}
                    {post.title}
                  </Link>
                  <div style={{ fontSize: "12px", color: "#888078", marginTop: "4px" }}>
                    {board.displayName} · {new Date(post.createdAt).toLocaleDateString("ko-KR")} · 조회 {post.viewCount ?? 0}
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
                href={`/mypage/posts?page=${p}`}
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
