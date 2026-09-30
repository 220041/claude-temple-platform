import Link from "next/link"
import SiteShell from "@/components/site-shell"
import BoardListTable from "./board-list-table"
import BoardGalleryGrid from "./board-gallery-grid"
import { getPostsForBoard } from "@/lib/boards"
import { getCurrentMemberCached } from "@/lib/memberAuth"

export default async function BoardListPage({
  boardKey,
  basePath,
  variant,
  page,
}: {
  boardKey: string
  basePath: string
  variant: "list" | "gallery"
  page: number
}) {
  const [{ board, posts, totalDocs, totalPages }, member] = await Promise.all([
    getPostsForBoard(boardKey, page),
    getCurrentMemberCached(),
  ])

  const canWrite = Boolean(member) && Boolean(board?.allowMemberPost)

  return (
    <SiteShell>
      <div className="max-w-[1000px] mx-auto px-8" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 className="font-serif" style={{ fontSize: "24px", fontWeight: 700, color: "#161410" }}>
            {board?.displayName ?? "게시판"}
          </h1>
          {canWrite && (
            <Link
              href={`${basePath}/write`}
              className="font-sans"
              style={{ padding: "8px 16px", background: "#161410", color: "#fff", fontSize: "13px" }}
            >
              글쓰기
            </Link>
          )}
        </div>

        {variant === "gallery" ? (
          <BoardGalleryGrid posts={posts} basePath={basePath} />
        ) : (
          <BoardListTable posts={posts} basePath={basePath} totalDocs={totalDocs} page={page} />
        )}

        {totalPages > 1 && (
          <div className="font-sans" style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "32px", fontSize: "13px" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`${basePath}?page=${p}`}
                style={{ padding: "4px 10px", color: p === page ? "#fff" : "#4e4a42", background: p === page ? "#161410" : "transparent" }}
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
