import Link from "next/link"
import SiteShell from "@/components/site-shell"
import { searchPosts } from "@/lib/search"
import { pathForBoardKey } from "@/lib/boards"
import type { Board } from "@/payload-types"

const BOARD_OPTIONS: { value: string; label: string }[] = [
  { value: "notices", label: "공지사항" },
  { value: "dharma", label: "법문" },
  { value: "press", label: "언론 속 봉림사" },
  { value: "monk-gallery", label: "회주·주지스님 포토갤러리" },
  { value: "scenery-gallery", label: "봉림풍경 포토갤러리" },
  { value: "community", label: "자유게시판" },
  { value: "stories", label: "봉림사 이야기" },
  { value: "gamrodang", label: "감로당" },
]

function excerpt(content: string, query: string): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, 80)
  const start = Math.max(0, idx - 30)
  return (start > 0 ? "…" : "") + content.slice(start, start + 100) + (start + 100 < content.length ? "…" : "")
}

const fieldStyle: React.CSSProperties = { padding: "9px 10px", border: "1px solid #d0ccc5", fontSize: "13px" }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; board?: string; from?: string; to?: string; page?: string }>
}) {
  const params = await searchParams
  const query = params.q ?? ""
  const page = Number(params.page) > 0 ? Number(params.page) : 1
  const { posts, totalPages, totalDocs } = await searchPosts({
    q: params.q,
    board: params.board,
    from: params.from,
    to: params.to,
    page,
  })

  return (
    <SiteShell>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "64px 24px" }}>
        <h1 className="font-serif" style={{ fontSize: "28px", fontWeight: 700, color: "#161410", marginBottom: "24px" }}>
          통합검색
        </h1>

        <form method="get" className="font-sans" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px" }}>
          <input
            name="q"
            type="text"
            defaultValue={params.q ?? ""}
            placeholder="제목, 내용, 작성자 닉네임으로 검색"
            style={{ ...fieldStyle, flex: "1 1 240px" }}
          />
          <select name="board" defaultValue={params.board ?? ""} style={fieldStyle}>
            <option value="">전체 게시판</option>
            {BOARD_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          <input name="from" type="date" defaultValue={params.from ?? ""} style={fieldStyle} />
          <input name="to" type="date" defaultValue={params.to ?? ""} style={fieldStyle} />
          <button type="submit" style={{ padding: "9px 20px", background: "#161410", color: "#fff", fontSize: "13px", fontWeight: 500 }}>
            검색
          </button>
        </form>

        {!query ? (
          <p className="font-sans" style={{ color: "#888078", fontSize: "14px" }}>검색어를 입력해 주세요.</p>
        ) : (
          <>
            <p className="font-sans" style={{ fontSize: "13px", color: "#888078", marginBottom: "16px" }}>
              &quot;{query}&quot; 검색결과 {totalDocs}건
            </p>

            {posts.length === 0 ? (
              <p className="font-sans" style={{ color: "#888078", fontSize: "14px" }}>검색 결과가 없습니다.</p>
            ) : (
              <ul className="font-sans" style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e1d8" }}>
                {posts.map((post) => {
                  const board = post.board as Board
                  return (
                    <li key={post.id} style={{ background: "#fff", padding: "14px 16px" }}>
                      <Link href={`${pathForBoardKey(board.boardKey)}/${post.id}`} style={{ color: "#161410", fontSize: "14px", fontWeight: 600 }}>
                        {post.title}
                      </Link>
                      <p style={{ fontSize: "13px", color: "#4e4a42", margin: "6px 0" }}>{excerpt(post.content, query)}</p>
                      <div style={{ fontSize: "12px", color: "#888078" }}>
                        {board.displayName} · {new Date(post.createdAt).toLocaleDateString("ko-KR")}
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
                    href={`/search?q=${encodeURIComponent(query)}&board=${params.board ?? ""}&from=${params.from ?? ""}&to=${params.to ?? ""}&page=${p}`}
                    className="font-sans"
                    style={{ fontSize: "13px", color: p === page ? "#161410" : "#888078", fontWeight: p === page ? 700 : 400 }}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SiteShell>
  )
}
