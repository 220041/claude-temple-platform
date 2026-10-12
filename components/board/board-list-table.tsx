import Link from "next/link"
import { isNew, resolveAuthorName } from "@/lib/boards"
import type { Post } from "@/payload-types"

type PostSummary = Post & { commentCount?: number }

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

// guide.md 13.1절: 번호, 제목, 작성자, 작성일, 조회수, 댓글수, 이미지첨부, NEW, 상단고정.
export default function BoardListTable({
  posts,
  basePath,
  totalDocs,
  page,
}: {
  posts: PostSummary[]
  basePath: string
  totalDocs: number
  page: number
}) {
  if (posts.length === 0) {
    return (
      <p className="font-sans" style={{ padding: "48px 0", textAlign: "center", color: "#888078", fontSize: "14px" }}>
        게시물이 없습니다.
      </p>
    )
  }

  const pageSize = 20
  return (
    <table className="font-sans" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
      <thead>
        <tr style={{ borderTop: "2px solid #161410", borderBottom: "1px solid #e8e6e1" }}>
          <th className="hidden md:table-cell" style={{ padding: "12px 8px", width: "60px", color: "#888078", fontWeight: 500 }}>번호</th>
          <th style={{ padding: "12px 8px", textAlign: "left", color: "#888078", fontWeight: 500 }}>제목</th>
          <th className="hidden md:table-cell" style={{ padding: "12px 8px", width: "100px", color: "#888078", fontWeight: 500 }}>작성자</th>
          <th style={{ padding: "12px 8px", width: "100px", color: "#888078", fontWeight: 500 }}>작성일</th>
          <th className="hidden md:table-cell" style={{ padding: "12px 8px", width: "70px", color: "#888078", fontWeight: 500 }}>조회</th>
          <th className="hidden md:table-cell" style={{ padding: "12px 8px", width: "70px", color: "#888078", fontWeight: 500 }}>댓글</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post, i) => {
          const isSecret = post.visibility === "secret"
          const hasImages = Boolean(post.featuredImage) || (post.images?.length ?? 0) > 0
          return (
            <tr key={post.id} style={{ borderBottom: "1px solid #f0efec" }}>
              <td className="hidden md:table-cell" style={{ padding: "12px 8px", textAlign: "center", color: "#aaa" }}>
                {post.pinned ? "고정" : totalDocs - (page - 1) * pageSize - i}
              </td>
              <td style={{ padding: "12px 8px" }}>
                <Link href={`${basePath}/${post.id}`} style={{ color: "#272520" }}>
                  {isSecret ? "🔒 비밀글입니다" : post.title}
                  {hasImages && !isSecret && <span style={{ color: "var(--color-accent)", marginLeft: "6px", fontSize: "12px" }}>[사진]</span>}
                  {isNew(post.createdAt) && (
                    <span className="font-sans font-bold" style={{ marginLeft: "6px", fontSize: "10px", color: "#cc5030" }}>
                      NEW
                    </span>
                  )}
                </Link>
              </td>
              <td className="hidden md:table-cell" style={{ padding: "12px 8px", textAlign: "center", color: "#656058" }}>{resolveAuthorName(post)}</td>
              <td style={{ padding: "12px 8px", textAlign: "center", color: "#aaa" }}>{formatDate(post.createdAt)}</td>
              <td className="hidden md:table-cell" style={{ padding: "12px 8px", textAlign: "center", color: "#aaa" }}>{post.viewCount ?? 0}</td>
              <td className="hidden md:table-cell" style={{ padding: "12px 8px", textAlign: "center", color: "#aaa" }}>{post.commentCount ?? 0}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
