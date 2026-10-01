import Image from "next/image"
import Link from "next/link"
import ViewCounter from "./view-counter"
import ReportButton from "./report-button"
import CommentSection from "./comment-section"
import { resolveAuthorName } from "@/lib/boards"
import { deletePostFormAction } from "@/app/(frontend)/actions/posts"
import type { Post, Comment } from "@/payload-types"

function resolveImageUrl(image: unknown): string {
  if (!image || typeof image !== "object") return ""
  // featuredImage/images는 relationTo: ['media-public', 'media-private']인
  // 폴리모픽 업로드 필드라 실제 값은 { relationTo, value } 형태로 감싸져
  // 있다(guide.md 폴리모픽 관계 관련 이슈 참고) — value 안쪽까지 들어가야
  // 실제 미디어 문서의 url을 얻을 수 있다.
  const target = "value" in image ? (image as { value: unknown }).value : image
  if (target && typeof target === "object" && "url" in target && typeof (target as { url?: unknown }).url === "string") {
    return (target as { url: string }).url
  }
  return ""
}

export default function PostDetail({
  post,
  comments,
  boardKey,
  basePath,
  currentMemberId,
  isOwner,
  commentsAllowed,
}: {
  post: Post
  comments: Comment[]
  boardKey: string
  basePath: string
  currentMemberId?: string | number
  isOwner: boolean
  commentsAllowed: boolean
}) {
  // guide.md 9.3: 비밀글은 목록엔 마스킹돼 노출되지만 본문은 작성자·
  // 관리자만 볼 수 있다. title/content는 필드 접근 제한으로 비소유자에게
  // 는 undefined로 내려오므로(Posts.ts의 secretFieldReadAccess), 그
  // 경우 상세 화면 자체를 막힘 안내로 대체한다.
  if (post.visibility === "secret" && post.title === undefined) {
    return (
      <div className="max-w-[800px] mx-auto px-8 text-center" style={{ paddingTop: "96px", paddingBottom: "96px" }}>
        <p className="font-serif" style={{ fontSize: "20px", fontWeight: 700, color: "#161410", marginBottom: "12px" }}>
          🔒 비밀글입니다
        </p>
        <p className="font-sans" style={{ fontSize: "14px", color: "#888078" }}>
          작성자와 관리자만 열람할 수 있습니다.
        </p>
      </div>
    )
  }

  const images = [post.featuredImage, ...(post.images?.map((i) => i.image) ?? [])]
    .map(resolveImageUrl)
    .filter((src, i, arr) => src && arr.indexOf(src) === i)

  return (
    <div className="max-w-[800px] mx-auto px-8" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
      <ViewCounter postId={String(post.id)} />

      <div style={{ borderBottom: "1px solid #e8e6e1", paddingBottom: "20px", marginBottom: "24px" }}>
        <h1 className="font-serif" style={{ fontSize: "26px", fontWeight: 700, color: "#161410", marginBottom: "12px" }}>
          {post.title}
        </h1>
        <div className="font-sans" style={{ fontSize: "13px", color: "#888078", display: "flex", gap: "12px" }}>
          <span>{resolveAuthorName(post)}</span>
          <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
          <span>조회 {post.viewCount ?? 0}</span>
        </div>
      </div>

      {isOwner && post.moderationStatus === "pending" && (
        <p
          className="font-sans"
          style={{ padding: "12px 16px", background: "#fdf6e3", border: "1px solid #d9c38a", color: "#6b5420", fontSize: "13px", marginBottom: "24px" }}
        >
          ⏳ 관리자 승인 대기 중입니다. 승인 전까지는 본인에게만 보입니다.
        </p>
      )}
      {isOwner && post.moderationStatus === "rejected" && (
        <p
          className="font-sans"
          style={{ padding: "12px 16px", background: "#fdf0ee", border: "1px solid #e3a89c", color: "#8a3524", fontSize: "13px", marginBottom: "24px" }}
        >
          🚫 반려된 게시물입니다{post.moderationReason ? ` — 사유: ${post.moderationReason}` : ""}. 수정 후 다시 제출하면 재검수됩니다.
        </p>
      )}

      {images.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          {images.map((src) => (
            <div key={src} className="relative w-full" style={{ minHeight: "320px" }}>
              <Image src={src} alt={post.title} fill className="object-contain" sizes="800px" />
            </div>
          ))}
        </div>
      )}

      <p className="font-sans" style={{ fontSize: "15px", color: "#333", lineHeight: 1.9, whiteSpace: "pre-line", marginBottom: "24px" }}>
        {post.content}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #e8e6e1" }}>
        <ReportButton target="posts" targetId={String(post.id)} isLoggedIn={Boolean(currentMemberId)} />
        {isOwner && (
          <div className="font-sans" style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
            <Link href={`${basePath}/${post.id}/edit`} style={{ color: "#4e4a42" }}>
              수정
            </Link>
            <form action={deletePostFormAction.bind(null, boardKey, String(post.id))}>
              <button type="submit" style={{ background: "none", border: "none", cursor: "pointer", color: "#4e4a42" }}>
                삭제
              </button>
            </form>
          </div>
        )}
      </div>

      {commentsAllowed ? (
        <CommentSection
          postId={String(post.id)}
          comments={comments}
          currentMemberId={currentMemberId}
          path={`${basePath}/${post.id}`}
          isLoggedIn={Boolean(currentMemberId)}
        />
      ) : (
        <p className="font-sans" style={{ marginTop: "48px", fontSize: "13px", color: "#888078" }}>
          이 게시물은 댓글을 허용하지 않습니다.
        </p>
      )}
    </div>
  )
}
