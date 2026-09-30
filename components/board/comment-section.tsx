"use client"

import { useActionState, useState } from "react"
import { createCommentAction, deleteCommentFormAction, type ActionResult } from "@/app/(frontend)/actions/comments"
import type { Comment } from "@/payload-types"

function authorLabel(c: Comment) {
  const m = c.memberAuthor
  if (m && typeof m === "object") return m.status === "withdrawn" ? "탈퇴한 회원" : (m.nickname ?? "회원")
  return "회원"
}

function ownerId(c: Comment) {
  const m = c.memberAuthor
  if (m && typeof m === "object") return m.id
  return m
}

function parentId(c: Comment) {
  const p = c.parentComment
  if (p && typeof p === "object") return p.id
  return p
}

function CommentForm({
  action,
  submitLabel,
  onDone,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>
  submitLabel: string
  onDone?: () => void
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(async (prev, formData) => {
    const result = await action(prev, formData)
    if ("success" in result) onDone?.()
    return result
  }, null)

  return (
    <form action={formAction} style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
      <textarea
        name="content"
        required
        rows={2}
        className="font-sans"
        style={{ flex: 1, padding: "8px 10px", border: "1px solid #d0ccc5", fontSize: "13px", resize: "vertical" }}
      />
      <button
        type="submit"
        disabled={pending}
        className="font-sans"
        style={{ padding: "0 16px", background: "#161410", color: "#fff", fontSize: "13px", flexShrink: 0 }}
      >
        {pending ? "..." : submitLabel}
      </button>
      {state && "error" in state && (
        <p className="font-sans" style={{ color: "#cc5030", fontSize: "12px" }}>
          {state.error}
        </p>
      )}
    </form>
  )
}

export default function CommentSection({
  postId,
  comments,
  currentMemberId,
  path,
  isLoggedIn,
}: {
  postId: string
  comments: Comment[]
  currentMemberId?: string | number
  path: string
  isLoggedIn: boolean
}) {
  const [replyTo, setReplyTo] = useState<string | number | null>(null)

  const topLevel = comments.filter((c) => !parentId(c))
  const repliesOf = (id: string | number) => comments.filter((c) => String(parentId(c)) === String(id))

  return (
    <section style={{ marginTop: "48px" }}>
      <h2 className="font-serif" style={{ fontSize: "18px", fontWeight: 700, color: "#161410", marginBottom: "16px" }}>
        댓글 {comments.length}
      </h2>

      {topLevel.length === 0 && (
        <p className="font-sans" style={{ fontSize: "13px", color: "#888078" }}>
          첫 댓글을 남겨보세요.
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {topLevel.map((c) => (
          <li key={c.id} style={{ padding: "16px 0", borderBottom: "1px solid #f0efec" }}>
            <CommentRow
              comment={c}
              path={path}
              currentMemberId={currentMemberId}
              onReplyClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
              isLoggedIn={isLoggedIn}
            />
            {replyTo === c.id && isLoggedIn && (
              <div style={{ marginLeft: "24px" }}>
                <CommentForm
                  action={createCommentAction.bind(null, path, postId, String(c.id))}
                  submitLabel="답글"
                  onDone={() => setReplyTo(null)}
                />
              </div>
            )}
            {repliesOf(c.id).map((reply) => (
              <div key={reply.id} style={{ marginLeft: "24px", marginTop: "12px", paddingLeft: "12px", borderLeft: "2px solid #e8e6e1" }}>
                <CommentRow comment={reply} path={path} currentMemberId={currentMemberId} isLoggedIn={isLoggedIn} />
              </div>
            ))}
          </li>
        ))}
      </ul>

      {isLoggedIn ? (
        <CommentForm action={createCommentAction.bind(null, path, postId, null)} submitLabel="등록" />
      ) : (
        <p className="font-sans" style={{ fontSize: "13px", color: "#888078", marginTop: "8px" }}>
          댓글을 작성하려면 로그인이 필요합니다.
        </p>
      )}
    </section>
  )
}

function CommentRow({
  comment,
  path,
  currentMemberId,
  onReplyClick,
  isLoggedIn,
}: {
  comment: Comment
  path: string
  currentMemberId?: string | number
  onReplyClick?: () => void
  isLoggedIn: boolean
}) {
  const isOwner = currentMemberId !== undefined && String(ownerId(comment)) === String(currentMemberId)
  const isHidden = Boolean(comment.hiddenAt)

  return (
    <div>
      <div className="font-sans" style={{ fontSize: "13px", color: "#161410", fontWeight: 600, marginBottom: "4px" }}>
        {authorLabel(comment)}
        <span className="font-sans" style={{ fontWeight: 400, color: "#aaa", marginLeft: "8px", fontSize: "12px" }}>
          {new Date(comment.createdAt).toLocaleString("ko-KR")}
        </span>
      </div>
      <p className="font-sans" style={{ fontSize: "14px", color: isHidden ? "#aaa" : "#333", whiteSpace: "pre-line" }}>
        {isHidden ? "관리자에 의해 숨겨진 댓글입니다." : comment.content}
      </p>
      <div className="font-sans" style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "12px", color: "#888078" }}>
        {onReplyClick && isLoggedIn && (
          <button onClick={onReplyClick} style={{ background: "none", border: "none", cursor: "pointer", color: "#888078" }}>
            답글
          </button>
        )}
        {isOwner && (
          <form action={deleteCommentFormAction.bind(null, path, String(comment.id))}>
            <button type="submit" style={{ background: "none", border: "none", cursor: "pointer", color: "#888078" }}>
              삭제
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
