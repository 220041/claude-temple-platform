"use client"

import { useActionState, useState } from "react"
import { upload } from "@vercel/blob/client"
import { createPostAction, updatePostAction, type ActionResult } from "@/app/(frontend)/actions/posts"

export default function PostForm({
  boardKey,
  allowSecret,
  allowImages,
  initial,
  postId,
}: {
  boardKey: string
  allowSecret: boolean
  allowImages: boolean
  initial?: { title: string; content: string; visibility?: string | null }
  postId?: string
}) {
  const action = postId ? updatePostAction.bind(null, boardKey, postId) : createPostAction.bind(null, boardKey)
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // guide.md 10.7절: Vercel 서버리스 함수는 요청 본문이 4.5MB로 고정
  // 제한돼 있어 10MB 이미지를 그대로 서버 액션에 보내면 항상 실패한다.
  // 그래서 파일을 먼저 Vercel Blob에 직접 업로드(우리 서버를 거치지
  // 않음)하고, 그 결과 URL만 작은 텍스트로 서버 액션에 전달한다.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploadError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0)
    formData.delete("images")

    if (files.length > 0) {
      setUploading(true)
      try {
        for (const file of files) {
          const result = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/blob-upload",
          })
          formData.append("imageBlobUrls", result.url)
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.")
        setUploading(false)
        return
      }
      setUploading(false)
    }

    formAction(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "16px" }}>
        <label className="font-sans" style={{ display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }}>
          제목
        </label>
        <input
          name="title"
          type="text"
          required
          defaultValue={initial?.title}
          className="font-sans"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0ccc5", fontSize: "14px" }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label className="font-sans" style={{ display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }}>
          내용
        </label>
        <textarea
          name="content"
          required
          rows={10}
          defaultValue={initial?.content}
          className="font-sans"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0ccc5", fontSize: "14px", resize: "vertical" }}
        />
      </div>

      {allowImages && !postId && (
        <div style={{ marginBottom: "16px" }}>
          <label className="font-sans" style={{ display: "block", fontSize: "13px", color: "#4e4a42", marginBottom: "6px" }}>
            사진 첨부 (최대 10장, 장당 10MB)
          </label>
          <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="font-sans" style={{ fontSize: "13px" }} />
        </div>
      )}

      {allowSecret && (
        <div style={{ marginBottom: "24px" }}>
          <label className="font-sans" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#4e4a42" }}>
            <input type="checkbox" name="visibility" value="secret" defaultChecked={initial?.visibility === "secret"} />
            비밀글로 작성 (작성자와 관리자만 볼 수 있습니다)
          </label>
        </div>
      )}

      {uploadError && (
        <p className="font-sans" style={{ color: "#cc5030", fontSize: "13px", marginBottom: "16px" }}>
          {uploadError}
        </p>
      )}

      {state && "error" in state && (
        <p className="font-sans" style={{ color: "#cc5030", fontSize: "13px", marginBottom: "16px" }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="font-sans"
        style={{ padding: "12px 32px", background: "#161410", color: "#fff", fontSize: "14px", fontWeight: 500 }}
      >
        {uploading ? "이미지 업로드 중..." : pending ? "저장 중..." : postId ? "수정하기" : "등록하기"}
      </button>
    </form>
  )
}
