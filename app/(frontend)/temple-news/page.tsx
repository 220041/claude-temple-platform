import Link from "next/link"
import SiteShell from "@/components/site-shell"
import { getTempleNewsPosts, pathForBoardKey } from "@/lib/boards"
import { getSiteSettings } from "@/lib/payload"
import type { Board } from "@/payload-types"

export const revalidate = 60

export async function generateMetadata() {
  const settings = await getSiteSettings()
  if (!settings?.installed) return { title: '사찰 소식' }
  const shortName = settings.siteShortName || settings.siteName || '사찰'
  const fullName = settings.siteName || settings.siteShortName || '사찰'
  return { title: `${shortName} 소식 | ${fullName}` }
}

export default async function TempleNewsPage() {
  const posts = await getTempleNewsPosts(50)

  return (
    <SiteShell>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "64px 24px" }}>
        <h1 className="font-serif" style={{ fontSize: "28px", fontWeight: 700, color: "#161410", marginBottom: "24px" }}>
          봉림사 소식
        </h1>

        {posts.length === 0 ? (
          <p className="font-sans" style={{ color: "#888078", fontSize: "14px" }}>등록된 소식이 없습니다.</p>
        ) : (
          <ul className="font-sans" style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e1d8" }}>
            {posts.map((post) => {
              const board = post.board as Board
              return (
                <li key={post.id} style={{ background: "#fff", padding: "14px 16px" }}>
                  <Link href={`${pathForBoardKey(board.boardKey)}/${post.id}`} style={{ color: "#161410", fontSize: "14px", fontWeight: 600 }}>
                    {post.title}
                  </Link>
                  <div style={{ fontSize: "12px", color: "#888078", marginTop: "4px" }}>
                    {board.displayName} · {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </SiteShell>
  )
}
