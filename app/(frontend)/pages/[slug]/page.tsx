import { draftMode } from "next/headers"
import { notFound } from "next/navigation"
import SiteShell from "@/components/site-shell"
import PageBlocksRenderer from "@/components/page-blocks-renderer"
import { getPayloadClient } from "@/lib/payload"

export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

async function getPage(slug: string, isDraft: boolean) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    draft: isDraft,
    overrideAccess: isDraft,
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params
  const page = await getPage(slug, false)
  if (!page) return {}
  return { title: `${page.title} | 하논봉림사` }
}

export default async function StaticPage({ params }: Params) {
  const { slug } = await params
  const draft = await draftMode()
  const page = await getPage(slug, draft.isEnabled)

  if (!page) notFound()

  return (
    <SiteShell>
      {draft.isEnabled && (
        <div
          className="font-sans"
          style={{ background: "#cc5030", color: "#fff", padding: "8px 16px", fontSize: "13px", textAlign: "center" }}
        >
          미리보기 모드입니다 — 아직 게시되지 않은 내용일 수 있습니다.
        </div>
      )}
      <div className="max-w-[900px] mx-auto px-8" style={{ paddingTop: "56px", paddingBottom: "80px" }}>
        <h1
          className="font-serif"
          style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, color: "#161410", marginBottom: "40px" }}
        >
          {page.title}
        </h1>
        <PageBlocksRenderer blocks={page.blocks ?? undefined} />
      </div>
    </SiteShell>
  )
}
