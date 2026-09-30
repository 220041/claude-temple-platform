export default function SiteNotice() {
  return (
    <aside
      aria-label="홈페이지 준비 안내"
      className="flex min-h-12 items-start justify-center gap-2 bg-[#f3f0e7] px-5 py-2 text-left text-[#49443c] sm:items-center sm:text-center"
    >
      <span aria-hidden="true" className="mt-2 h-[7px] w-[7px] shrink-0 rounded-full bg-[#b99b65] sm:mt-0" />
      <p className="m-0 text-xs leading-6 sm:text-[13px]">
        더 나은 모습으로 인사드리기 위해 <strong>새로운 홈페이지를 준비하고 있습니다.</strong> 방문과 전화문의는 평소처럼 가능합니다.
      </p>
    </aside>
  )
}
