import Image from "next/image"
import Link from "next/link"

export default function TemporaryHeader() {
  return (
    <header className="border-b border-[#e8e6e1] bg-white">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center px-8 lg:px-16">
        <Link href="/" className="flex flex-col items-center gap-1.5 leading-none">
          <span className="font-sans text-[11px] tracking-[0.12em] text-[#aaa]">하논에 깃든 사찰</span>
          <Image
            src="/images/logo-combined.png"
            alt="대한불교조계종 봉림사 Bonglimsa"
            width={357}
            height={63}
            className="h-10 w-auto"
            priority
          />
        </Link>
      </div>
    </header>
  )
}
