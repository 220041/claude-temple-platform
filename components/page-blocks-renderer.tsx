import Image from "next/image"
import type { Page } from "@/payload-types"

type Blocks = NonNullable<Page["blocks"]>

function resolveImageUrl(image: unknown): string {
  if (image && typeof image === "object" && "url" in image && typeof (image as { url?: unknown }).url === "string") {
    return (image as { url: string }).url
  }
  return ""
}

// guide.md 5.2: 허용된 5개 블록만 렌더링한다. 관리자 입력값은 항상 일반
// 텍스트/이미지 필드로만 들어오므로 dangerouslySetInnerHTML을 쓰지 않는다.
export default function PageBlocksRenderer({ blocks }: { blocks?: Blocks }) {
  if (!blocks || blocks.length === 0) {
    return (
      <p className="font-sans" style={{ color: "#888078", fontSize: "14px" }}>
        준비 중인 페이지입니다.
      </p>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {blocks.map((block, i) => {
        switch (block.blockType) {
          case "heading": {
            const Tag = block.level === "h3" ? "h3" : "h2"
            return (
              <Tag
                key={i}
                className="font-serif"
                style={{
                  fontSize: block.level === "h3" ? "22px" : "clamp(24px, 3vw, 34px)",
                  fontWeight: 700,
                  color: "#161410",
                  lineHeight: 1.3,
                }}
              >
                {block.text}
              </Tag>
            )
          }
          case "paragraph":
            return (
              <p
                key={i}
                className="font-sans"
                style={{ fontSize: "15px", color: "#4e4a42", lineHeight: 1.9, whiteSpace: "pre-line" }}
              >
                {block.text}
              </p>
            )
          case "photo": {
            const src = resolveImageUrl(block.image)
            if (!src) return null
            return (
              <figure key={i}>
                <div className="relative w-full" style={{ minHeight: "320px" }}>
                  <Image src={src} alt={block.caption ?? ""} fill className="object-cover" sizes="100vw" />
                </div>
                {block.caption && (
                  <figcaption className="font-sans" style={{ fontSize: "13px", color: "#888078", marginTop: "8px" }}>
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            )
          }
          case "gallery": {
            const images = block.images ?? []
            if (images.length === 0) return null
            return (
              <div key={i} className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "16px" }}>
                {images.map((item, j) => {
                  const src = resolveImageUrl(item.image)
                  if (!src) return null
                  return (
                    <figure key={j}>
                      <div className="relative w-full" style={{ height: "220px" }}>
                        <Image
                          src={src}
                          alt={item.caption ?? ""}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                      {item.caption && (
                        <figcaption className="font-sans" style={{ fontSize: "12px", color: "#888078", marginTop: "6px" }}>
                          {item.caption}
                        </figcaption>
                      )}
                    </figure>
                  )
                })}
              </div>
            )
          }
          case "infoTable": {
            const rows = block.rows ?? []
            if (rows.length === 0) return null
            return (
              <table key={i} className="font-sans" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <tbody>
                  {rows.map((row, j) => (
                    <tr key={j} style={{ borderBottom: "1px solid #e8e6e1" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px 16px",
                          width: "160px",
                          color: "#888078",
                          fontWeight: 600,
                          background: "#fdfbf8",
                        }}
                      >
                        {row.label}
                      </th>
                      <td style={{ padding: "12px 16px", color: "#333" }}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
          default:
            return null
        }
      })}
    </div>
  )
}
