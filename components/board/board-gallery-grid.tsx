import Image from "next/image"
import Link from "next/link"
import { isNew, resolveAuthorName } from "@/lib/boards"
import type { Post } from "@/payload-types"

type PostSummary = Post & { commentCount?: number }

function resolveImageUrl(image: unknown): string {
  if (!image || typeof image !== "object") return ""
  // featuredImage는 relationTo: ['media-public','media-private'] 폴리모픽
  // 업로드 필드라 { relationTo, value } 형태로 감싸져 있다(post-detail.tsx
  // 참고) — value 안쪽까지 들어가야 실제 미디어 문서의 url을 얻는다.
  const target = "value" in image ? (image as { value: unknown }).value : image
  if (target && typeof target === "object" && "url" in target && typeof (target as { url?: unknown }).url === "string") {
    return (target as { url: string }).url
  }
  return ""
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

// guide.md 13.2절: 대표이미지, 제목, 작성자, 작성일, 조회수, 댓글수.
export default function BoardGalleryGrid({ posts, basePath }: { posts: PostSummary[]; basePath: string }) {
  if (posts.length === 0) {
    return (
      <p className="font-sans" style={{ padding: "48px 0", textAlign: "center", color: "#888078", fontSize: "14px" }}>
        게시물이 없습니다.
      </p>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "24px" }}>
      {posts.map((post) => {
        const src = resolveImageUrl(post.featuredImage)
        return (
          <Link key={post.id} href={`${basePath}/${post.id}`} className="group">
            <div className="relative w-full overflow-hidden" style={{ height: "200px", background: "#f0efec" }}>
              {src && (
                <Image
                  src={src}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              )}
            </div>
            <div style={{ padding: "12px 4px" }}>
              <p className="font-sans" style={{ fontSize: "14px", color: "#272520", marginBottom: "6px" }}>
                {post.title}
                {isNew(post.createdAt) && (
                  <span className="font-sans font-bold" style={{ marginLeft: "6px", fontSize: "10px", color: "#cc5030" }}>
                    NEW
                  </span>
                )}
              </p>
              <p className="font-sans" style={{ fontSize: "12px", color: "#aaa" }}>
                {resolveAuthorName(post)} · {formatDate(post.createdAt)} · 조회 {post.viewCount ?? 0} · 댓글 {post.commentCount ?? 0}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
