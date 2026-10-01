export default function SiteNotice({ text }: { text?: string | null }) {
  if (!text) return null

  return (
    <aside
      aria-label="사이트 안내"
      className="flex min-h-12 items-start justify-center gap-2 bg-[#f3f0e7] px-5 py-2 text-left text-[#49443c] sm:items-center sm:text-center"
    >
      <span aria-hidden="true" className="mt-2 h-[7px] w-[7px] shrink-0 rounded-full bg-[#b99b65] sm:mt-0" />
      <p className="m-0 text-xs leading-6 sm:text-[13px]">{text}</p>
    </aside>
  )
}
