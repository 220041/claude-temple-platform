/**
 * SiteSettings.installed가 false일 때 홈 화면 대신 보여주는 안내.
 * 특정 사찰의 이름·로고·사진을 전혀 참조하지 않는다 — 새로 설치된
 * 인스턴스가 다른 사찰의 자료를 대신 노출하지 않게 하는 화면.
 */
export default function InstallationPending() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center">
      <p className="font-serif text-2xl font-bold text-[#161410]">이 사찰 홈페이지는 아직 설정되지 않았습니다</p>
      <p className="mt-4 max-w-md font-sans text-sm leading-7 text-[#656058]">
        관리자가 사찰 정보를 입력하면 이 자리에 홈페이지가 표시됩니다.
      </p>
    </div>
  )
}
