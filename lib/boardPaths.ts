/** boardKey -> 프런트엔드 URL 경로. guide.md 13절 URL 규격 그대로. */
export const BOARD_PATHS: Record<string, string> = {
  notices: '/notices',
  dharma: '/dharma',
  press: '/press',
  'monk-gallery': '/gallery/monks',
  'scenery-gallery': '/gallery/scenery',
  community: '/community',
  stories: '/stories/bonglimsa',
  gamrodang: '/stories/gamrodang',
}

export function pathForBoardKey(boardKey: string): string {
  return BOARD_PATHS[boardKey] ?? `/boards/${boardKey}`
}

/** 기존 8개 고정 게시판인지 — `/boards/[slug]`가 이 값들과 겹쳐 이중 노출되는 것을 막는 데 쓴다. */
export function isLegacyBoardKey(boardKey: string): boolean {
  return boardKey in BOARD_PATHS
}
