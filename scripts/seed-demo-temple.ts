import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import config from '../payload.config'
import { getPayload } from 'payload'

/**
 * 비개발자 사용성 시험·화면 점검용 "데모 사찰(청솔사)" 채우기 스크립트. 가상의 사찰이며 실제 사찰 데이터와 무관하다.
 *
 *   DEMO_SEED_CONFIRM=청솔사 pnpm payload run scripts/seed-demo-temple.ts
 *
 * - 설치가 안 된(site-settings.installed=false) 빈 DB에서만 실행한다. 이미 설치된 DB(실제 사찰)는 건드리지 않는다.
 * - 사진은 sharp로 만든 단순한 그림(산·소나무·기와지붕)이며 media-public(Blob)에 올라간다.
 * - 시험용 계정(최고관리자·편집자·회원 2명)을 만들고 비밀번호는 repo 루트의 demo-accounts.local.txt(.gitignore 대상, DEMO_ACCOUNTS_FILE로 경로 변경 가능)에만 적는다.
 */
if (process.env.DEMO_SEED_CONFIRM !== '청솔사') {
  throw new Error('안전장치: DEMO_SEED_CONFIRM=청솔사 를 지정해야 실행됩니다. (빈 DB 전용)')
}

const payload = await getPayload({ config })
const log = (m: string) => payload.logger.info(m)
const create = (args: Record<string, unknown>) => payload.create({ overrideAccess: true, ...args } as never) as Promise<{ id: number }>

const site = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
if (site.installed) throw new Error(`이미 설치된 DB입니다(siteName=${site.siteName}). 데모 데이터를 넣지 않습니다.`)

// ---------- 그림 생성 ----------
function rng(seed: number) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296) }
type Pal = { sky: [string, string]; sun: string; far: string; mid: string; near: string; tree: string }
const PALS: Record<string, Pal> = {
  dawn: { sky: ['#f6d6b8', '#e9a98b'], sun: '#fff1d6', far: '#b9a2a8', mid: '#8e7f8f', near: '#4f5f58', tree: '#2c3d33' },
  day: { sky: ['#cfe5ee', '#f3efe2'], sun: '#fffbe8', far: '#a8c1bd', mid: '#7ea39a', near: '#4d7566', tree: '#2a4a3d' },
  dusk: { sky: ['#31405e', '#d98c6c'], sun: '#ffd9a0', far: '#59566f', mid: '#403f58', near: '#2b2f3f', tree: '#171b26' },
  autumn: { sky: ['#f2e3c4', '#e7b873'], sun: '#fff4d2', far: '#cfa377', mid: '#a9714a', near: '#7a4c35', tree: '#45291e' },
  snow: { sky: ['#dfe7f0', '#f7f8fb'], sun: '#ffffff', far: '#c4cedc', mid: '#a8b5c8', near: '#7d8ca3', tree: '#4d5a70' },
}
function art(w: number, h: number, p: Pal, seed: number, temple: boolean) {
  const r = rng(seed)
  const ridge = (base: number, amp: number, fill: string) => {
    const pts: string[] = [`0,${h}`]
    for (let x = 0; x <= w; x += w / 14) pts.push(`${x.toFixed(0)},${(h * base - r() * amp * h).toFixed(0)}`)
    pts.push(`${w},${h}`)
    return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`
  }
  const trees = Array.from({ length: 9 }, (_, i) => {
    const x = (w / 9) * i + r() * 60, th = h * (0.14 + r() * 0.1), tw = th * 0.42, y = h * 0.93
    return `<polygon points="${x},${y} ${x + tw / 2},${y - th} ${x + tw},${y}" fill="${p.tree}"/><polygon points="${x + 4},${y - th * 0.45} ${x + tw / 2},${y - th * 1.12} ${x + tw - 4},${y - th * 0.45}" fill="${p.tree}"/>`
  }).join('')
  const roof = temple
    ? (() => { const cx = w * 0.62, y = h * 0.66, bw = w * 0.2
        return `<rect x="${cx - bw * 0.4}" y="${y}" width="${bw * 0.8}" height="${h * 0.12}" fill="${p.tree}"/>` +
          `<path d="M${cx - bw},${y} Q${cx - bw * 0.55},${y - h * 0.02} ${cx},${y - h * 0.1} Q${cx + bw * 0.55},${y - h * 0.02} ${cx + bw},${y} Z" fill="${p.tree}"/>` +
          `<path d="M${cx - bw * 1.15},${y + 6} Q${cx - bw * 0.9},${y - 2} ${cx - bw},${y} L${cx + bw},${y} Q${cx + bw * 0.9},${y - 2} ${cx + bw * 1.15},${y + 6} Z" fill="${p.tree}"/>` })()
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <circle cx="${w * (0.2 + r() * 0.5)}" cy="${h * (0.22 + r() * 0.12)}" r="${h * 0.09}" fill="${p.sun}" opacity="0.9"/>
    ${ridge(0.62, 0.18, p.far)}${ridge(0.74, 0.14, p.mid)}${ridge(0.86, 0.1, p.near)}${roof}${trees}</svg>`
}
let imgNo = 0
async function image(alt: string, pal: keyof typeof PALS, opts: { w?: number; h?: number; temple?: boolean } = {}) {
  const w = opts.w ?? 1600, h = opts.h ?? 900
  imgNo += 1
  const data = await sharp(Buffer.from(art(w, h, PALS[pal], imgNo * 7919, Boolean(opts.temple)))).jpeg({ quality: 82 }).toBuffer()
  return (await create({ collection: 'media-public', data: { alt }, file: { data, mimetype: 'image/jpeg', name: `demo-${String(imgNo).padStart(2, '0')}.jpg`, size: data.length } })).id
}

// ---------- 계정 ----------
const pw = () => 'Demo-' + crypto.randomBytes(7).toString('hex')
const accounts = {
  admin: { email: 'demo-admin@example.test', password: pw(), role: '최고관리자' },
  editor: { email: 'demo-editor@example.test', password: pw(), role: '편집자' },
  member1: { email: 'demo-member1@example.test', password: pw(), role: '회원(닉네임: 푸른솔)' },
  member2: { email: 'demo-member2@example.test', password: pw(), role: '회원(닉네임: 맑은샘)' },
}
const adminDoc = await create({ collection: 'admins', data: { email: accounts.admin.email, password: accounts.admin.password, name: '데모 최고관리자', role: 'super-admin' } })
await create({ collection: 'admins', data: { email: accounts.editor.email, password: accounts.editor.password, name: '데모 편집자', role: 'editor' } })
const agreed = { termsVersion: 'v1', privacyVersion: 'v1', boardPolicyVersion: 'v1', agreedAt: new Date().toISOString(), status: 'active', _verified: true }
const m1 = await create({ collection: 'members', data: { email: accounts.member1.email, password: accounts.member1.password, nickname: '푸른솔', realName: '데모회원일', ...agreed }, disableVerificationEmail: true })
const m2 = await create({ collection: 'members', data: { email: accounts.member2.email, password: accounts.member2.password, nickname: '맑은샘', realName: '데모회원이', ...agreed }, disableVerificationEmail: true })
log('계정 4개 생성')

// ---------- 사진 ----------
const hero = [await image('새벽 예불을 마친 도량', 'dawn', { temple: true }), await image('푸른 솔 사이로 보이는 법당', 'day', { temple: true }), await image('노을 지는 산사', 'dusk', { temple: true })]
const introImg = await image('청솔사 전경', 'day', { w: 1200, h: 900, temple: true })
const monkImg = await image('도량의 아침', 'dawn', { w: 1200, h: 900 })
const cardImgs = [await image('새벽 예불', 'dawn', { w: 900, h: 600 }), await image('일요 법회', 'day', { w: 900, h: 600 }), await image('연중 기도', 'autumn', { w: 900, h: 600 })]
const mascot = await image('청솔사 상징', 'snow', { w: 400, h: 400 })
const popupImg = await image('10월 정기 법회 안내', 'autumn', { w: 800, h: 1000, temple: true })
const pageImgs = [await image('대웅전', 'day', { temple: true }), await image('종각', 'autumn'), await image('산책길', 'snow')]
const gal = {
  spring: [await image('봄 도량', 'day', { temple: true }), await image('벚꽃 길', 'dawn'), await image('연등', 'autumn')],
  fall: [await image('가을 단풍', 'autumn', { temple: true }), await image('낙엽 길', 'autumn')],
  winter: [await image('설경', 'snow', { temple: true }), await image('눈 내린 소나무', 'snow'), await image('동안거 입재', 'dusk')],
  dusk: [await image('저녁 예불', 'dusk', { temple: true })],
}
log(`사진 ${imgNo}장 생성`)

// ---------- 페이지 ----------
const H = (text: string, level: 'h2' | 'h3' = 'h2') => ({ blockType: 'heading', text, level })
const P = (text: string) => ({ blockType: 'paragraph', text })
const T = (...rows: [string, string][]) => ({ blockType: 'infoTable', rows: rows.map(([label, value]) => ({ label, value })) })
const PH = (image: number, caption: string) => ({ blockType: 'photo', image, caption })
const GAL = (...imgs: [number, string][]) => ({ blockType: 'gallery', images: imgs.map(([image, caption]) => ({ image, caption })) })
const page = async (title: string, slug: string, blocks: unknown[]) => (await create({ collection: 'pages', data: { title, slug, blocks, _status: 'published' } })).id
const pages = {
  intro: await page('사찰 소개', 'temple-intro', [
    H('청솔사를 소개합니다'), PH(pageImgs[0], '청솔사 대웅전'),
    P('청솔사는 한라산 기슭의 푸른 소나무 숲 속에 자리한 사찰입니다. 오랜 세월 수행과 기도의 도량으로 지역 주민과 함께해 왔습니다.'),
    H('연혁', 'h3'), T(['창건', '조선 후기'], ['중창', '1950년대 복원 불사'], ['현재', '매일 새벽 예불과 주말 법회 봉행']),
    P('누구나 편안히 들러 차 한잔과 함께 마음을 쉬어 갈 수 있는 열린 도량을 지향합니다.'),
  ]),
  abbot: await page('주지 스님 인사말', 'abbot', [
    H('주지 스님 인사말'), P('청솔사를 찾아 주신 모든 분께 합장 인사드립니다.'),
    P('바쁜 일상 속에서도 잠시 멈추어 자신을 돌아보는 시간이 필요합니다. 이곳이 그런 쉼표가 되기를 바랍니다.\n언제든 편안한 마음으로 찾아와 주십시오.'), PH(pageImgs[1], '도량의 종각'),
  ]),
  location: await page('오시는 길', 'location', [
    H('오시는 길'),
    T(['주소', '제주특별자치도 ○○시 ○○로 123'], ['전화', '064-000-0000'], ['주차', '경내 주차장 30대(무료)']),
    H('대중교통', 'h3'), P('버스: ○○번 승차 후 청솔사 입구 정류장 하차, 도보 10분.\n자가용: 시내에서 약 20분.'),
    PH(pageImgs[2], '입구 산책길'),
  ]),
  prayer: await page('법회·기도 안내', 'prayer-info', [
    H('정기 법회와 기도'), P('모든 법회는 사전 신청 없이 참석하실 수 있습니다.'),
    T(['새벽 예불', '매일 오전 4시 30분'], ['일요 법회', '매주 일요일 오전 10시'], ['초하루 법회', '음력 1일 오전 10시'], ['관음재일', '음력 24일 오전 10시']),
    P('기도 접수는 법당 접수처 또는 전화로 가능합니다.'),
  ]),
  templestay: await page('템플스테이 안내', 'templestay', [
    H('템플스테이'), P('하룻밤 도량에 머물며 예불, 발우공양, 숲길 명상을 체험합니다.'),
    GAL([gal.spring[0], '봄 도량'], [gal.fall[0], '가을 단풍'], [gal.winter[0], '설경']),
    T(['일정', '매월 둘째·넷째 주말(1박 2일)'], ['대상', '성인 누구나'], ['문의', '064-000-0000']),
  ]),
}
log('페이지 5개 생성')

// ---------- 게시판 ----------
const board = async (boardKey: string, displayName: string, extra: Record<string, unknown>) => (await create({ collection: 'boards', data: { boardKey, displayName, ...extra } })).id
const boards = {
  notices: await board('news', '공지사항', { boardType: 'notice' }),
  dharma: await board('teaching', '법문', { boardType: 'general' }),
  gallery: await board('photos', '사진 갤러리', { boardType: 'gallery' }),
  community: await board('free', '자유게시판', { boardType: 'general', adminOnly: false, allowMemberPost: true, memberPostApproval: 'immediate', allowSecret: true }),
  stories: await board('story', '이야기마당', { boardType: 'general', adminOnly: false, allowMemberPost: true, memberPostApproval: 'requiresApproval' }),
}
const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString()
const post = async (board: number, title: string, content: string, extra: Record<string, unknown> = {}, days = 0) =>
  (await create({ collection: 'posts', data: { board, title, content, _status: 'published', createdAt: ago(days), ...extra }, user: { ...adminDoc, collection: 'admins' } })).id

const notices: [string, string, Record<string, unknown>, number][] = [
  ['10월 정기 법회 안내', '10월 정기 법회는 첫째 주 일요일 오전 10시에 봉행합니다.\n점심 공양(국수)이 준비되어 있습니다. 많은 참석 바랍니다.', { pinned: true, showInTempleNews: true, templeNewsFeatured: true }, 1],
  ['동안거 결제 안내', '동안거 결제를 앞두고 입재 법회를 봉행합니다.\n자세한 일정은 법당 게시판을 참고해 주세요.', { pinned: true, showInTempleNews: true }, 3],
  ['주차장 공사 안내', '10월 15일부터 일주일간 주차장 보수 공사가 있습니다. 이 기간에는 입구 갓길을 이용해 주세요.', { showInTempleNews: true }, 5],
  ['템플스테이 11월 일정 공지', '11월 템플스테이는 둘째·넷째 주말에 진행됩니다.\n신청은 전화 또는 방문 접수로 받습니다.', { showInTempleNews: true }, 8],
  ['사찰 음식 체험 프로그램', '계절 재료로 만드는 사찰 음식 체험을 엽니다. 정원은 20명입니다.', {}, 12],
  ['봉사자 모집', '법회 안내와 공양간 봉사에 참여하실 분을 모집합니다.', {}, 16],
  ['홈페이지를 새로 열었습니다', '청솔사 홈페이지가 새로 문을 열었습니다. 많은 이용 바랍니다.', { showInTempleNews: true }, 20],
  ['초하루 법회 시간 변경', '초하루 법회는 오전 10시로 시간이 변경되었습니다.', {}, 25],
]
for (const [t, c, e, d] of notices) await post(boards.notices, t, c, e, d)
const dharmaItems: [string, string, number][] = [
  ['마음을 쉬는 법', '분주한 일상에서 마음을 내려놓는 세 가지 방법을 이야기합니다.', 6],
  ['한 숨 쉬고 가세요', '호흡을 가다듬는 짧은 명상법을 소개합니다.', 18],
  ['감사하는 마음', '작은 것에서 감사를 찾는 수행에 대한 법문입니다.', 30],
]
for (const [t, c, d] of dharmaItems) await post(boards.dharma, t, c, {}, d)
const galleryItems: [string, number[], number][] = [['봄 도량', gal.spring, 40], ['가을 단풍', gal.fall, 22], ['설경', gal.winter, 10], ['저녁 예불', gal.dusk, 4]]
  .map(([t, imgs, d]) => [t as string, imgs as number[], d as number])
for (const [t, imgs, d] of galleryItems) await post(boards.gallery, t, `${t} 사진입니다.`, { featuredImage: { relationTo: 'media-public', value: imgs[0] }, images: imgs.map((i) => ({ image: { relationTo: 'media-public', value: i } })) }, d)
log('게시판 5개·공지/법문/갤러리 게시물 생성')

// 회원 글·댓글(작성 시각을 과거로 두어 1분 1건 제한과 충돌하지 않게 함)
const memberPost = async (m: { id: number }, b: number, title: string, content: string, extra: Record<string, unknown>, days: number) =>
  (await create({ collection: 'posts', data: { board: b, title, content, createdAt: ago(days), ...extra }, user: { ...m, collection: 'members' } })).id
const c1 = await memberPost(m1, boards.community, '법회에 다녀왔습니다', '처음 참석했는데 마음이 편안해졌습니다. 다음 법회에도 참석하고 싶습니다.', {}, 3)
await memberPost(m2, boards.community, '템플스테이 후기', '1박 2일 동안 많이 쉬고 왔습니다. 발우공양이 특히 인상 깊었어요.', {}, 6)
await memberPost(m1, boards.community, '문의드립니다(비공개)', '개인 기도 접수 관련해서 문의드립니다.', { visibility: 'secret' }, 2)
const approvedStory = await memberPost(m2, boards.stories, '어릴 적 이 절에서의 기억', '어릴 때 어머니 손을 잡고 오던 도량의 풍경이 아직도 생생합니다.', {}, 9)
await payload.update({ collection: 'posts', id: approvedStory, data: { moderationStatus: 'approved' }, overrideAccess: true } as never)
await memberPost(m1, boards.stories, '새벽 예불 체험기(승인 대기)', '새벽 예불에 처음 참석한 경험을 적어 봅니다. 승인을 기다리는 글입니다.', {}, 1)
await memberPost(m2, boards.stories, '단풍 사진과 함께(승인 대기)', '도량의 가을 풍경을 보고 느낀 점을 남깁니다.', {}, 1)
for (const [m, text, d] of [[m2, '저도 처음엔 긴장했는데 금방 편해지더라고요.', 2], [m1, '공감합니다. 다음 법회에서 뵙겠습니다.', 1]] as const) {
  await create({ collection: 'comments', data: { post: c1, content: text, createdAt: ago(d) }, user: { ...m, collection: 'members' } })
}
await create({ collection: 'reports', data: { target: { relationTo: 'posts', value: c1 }, reason: 'spam' }, user: { ...m2, collection: 'members' } }).catch((e) => log(`신고 예시 생성 건너뜀: ${(e as Error).message}`))
log('회원 글·댓글·신고 예시 생성')

// ---------- 메뉴·푸터·팝업·홈페이지·사이트 설정 ----------
await payload.updateGlobal({ slug: 'main-menu', overrideAccess: true, data: {
  items: [
    { label: '사찰 안내', linkType: 'none', children: [
      { label: '사찰 소개', linkType: 'page', pageRef: pages.intro }, { label: '주지 스님', linkType: 'page', pageRef: pages.abbot }, { label: '오시는 길', linkType: 'page', pageRef: pages.location } ] },
    { label: '기도·법회', linkType: 'none', children: [
      { label: '법회·기도 안내', linkType: 'page', pageRef: pages.prayer }, { label: '템플스테이', linkType: 'page', pageRef: pages.templestay } ] },
    { label: '법문·소식', linkType: 'none', children: [
      { label: '공지사항', linkType: 'board', boardRef: boards.notices }, { label: '법문', linkType: 'board', boardRef: boards.dharma }, { label: '사진 갤러리', linkType: 'board', boardRef: boards.gallery } ] },
    { label: '열린 마당', linkType: 'none', children: [
      { label: '자유게시판', linkType: 'board', boardRef: boards.community }, { label: '이야기마당', linkType: 'board', boardRef: boards.stories } ] },
  ],
  utilityLinks: [{ label: '기도·법회', linkType: 'page', pageRef: pages.prayer }, { label: '오시는 길', linkType: 'page', pageRef: pages.location }],
  _status: 'published' } as never })
await payload.updateGlobal({ slug: 'footer-settings', overrideAccess: true, data: {
  address: '제주특별자치도 ○○시 ○○로 123', phone: '064-000-0000', fax: '064-000-0001', email: 'info@example.test',
  copyrightText: 'All rights reserved.', tagline: '마음이 힘들 때 "관세음보살"을 불러보세요.', _status: 'published' } as never })
await payload.updateGlobal({ slug: 'popup-settings', overrideAccess: true, data: {
  enabled: true, title: '10월 정기 법회 안내', image: popupImg, linkUrl: '/boards/news', startDate: ago(1), endDate: new Date(Date.now() + 30 * 86400000).toISOString(), allowHideForOneDay: true } as never })
await payload.updateGlobal({ slug: 'home-page', overrideAccess: true, data: {
  sectionOrder: [{ section: 'templeIntro' }, { section: 'prayer' }, { section: 'location' }],
  showTempleIntro: true, showMonkIntro: true, showPrayerSection: true, showLocationSection: true,
  mainSlides: [
    { image: hero[0], title: '청솔사에 오신 것을 환영합니다', subtitle: '푸른 솔 아래 깃든 사찰', description: '매일 새벽 예불로 하루를 엽니다.', linkUrl: `/pages/${'temple-intro'}`, enabled: true },
    { image: hero[1], title: '누구나 편안한 열린 도량', subtitle: '법회와 템플스테이', description: '사전 신청 없이 참석하실 수 있습니다.', linkUrl: '/pages/prayer-info', enabled: true },
    { image: hero[2], title: '마음을 쉬어 가는 시간', subtitle: '저녁 예불과 명상', description: '노을 지는 도량에서 하루를 마무리하세요.', enabled: true } ],
  templeNews: { displayCount: 7 },
  templeIntro: { title: '푸른 솔 아래\n오랜 수행의 도량', summary: '청솔사는 한라산 기슭에서 오랜 세월 기도와 수행의 자리를 지켜 왔습니다.\n누구나 편안히 들러 마음을 쉴 수 있는 곳입니다.', image: introImg, linkUrl: '/pages/temple-intro' },
  monkIntro: { title: '주지 스님을 소개합니다', summary: '대중과 함께 수행하며 정진하시는 주지 스님의 인사말을 전합니다.', image: monkImg, linkUrl: '/pages/abbot' },
  prayerMascot: mascot,
  prayerCards: [
    { title: '새벽 예불', description: '매일 오전 4시 30분', image: cardImgs[0], linkUrl: '/pages/prayer-info', icon: 'calendar' },
    { title: '일요 법회', description: '매주 일요일 오전 10시', image: cardImgs[1], linkUrl: '/pages/prayer-info', icon: 'users' },
    { title: '연중 기도', description: '입재와 회향 안내', image: cardImgs[2], linkUrl: '/pages/prayer-info', icon: 'heart' } ],
  _status: 'published' } as never })
await payload.updateGlobal({ slug: 'site-settings', overrideAccess: true, data: {
  installed: true, homepageReady: true, siteName: '청솔사', siteShortName: '청솔사', siteNameEn: 'Cheongsolsa', affiliation: '대한불교조계종',
  siteDescription: '한라산 기슭의 푸른 솔 아래 자리한 열린 도량, 청솔사입니다.', siteKeywords: '청솔사, 사찰, 법회, 템플스테이',
  logoTagline: '푸른 솔 아래 깃든 사찰', emailFromName: '[청솔사]', location: { lat: 33.3617, lng: 126.5292, mapLabel: '청솔사', zoomLevel: 4 } } as never })

const file = path.resolve(process.env.DEMO_ACCOUNTS_FILE ?? path.resolve(process.cwd(), 'demo-accounts.local.txt'))
fs.writeFileSync(file, ['# 데모 사찰(청솔사) 시험용 계정 — 이 파일은 git에 올리지 않습니다.', '', ...Object.values(accounts).map((a) => `${a.role}\n  이메일: ${a.email}\n  비밀번호: ${a.password}\n`)].join('\n'))
log(`데모 사찰 준비 완료. 계정 정보: ${file}`)
process.exit(0)
