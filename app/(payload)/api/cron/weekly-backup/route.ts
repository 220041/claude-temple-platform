import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { runWeeklyBackup } from '@/lib/backup'

/**
 * Vercel Cron이 매주 1회 호출하는 백업 엔드포인트(app/(payload)/api/cron/run-jobs/route.ts와
 * 동일한 CRON_SECRET 인증 — 별도 라우트로 분리한 이유는 vercel.json 참고).
 * 성공/실패 결과를 "양측"(사찰 운영자 super-admin 전원 + 공통 유지보수자)에게
 * 이메일로 알린다.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET이 설정되지 않았습니다.' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  const { docs: superAdmins } = await payload.find({
    collection: 'admins',
    where: { role: { equals: 'super-admin' } },
    overrideAccess: true,
    limit: 0,
    pagination: false,
  })
  const recipients = [...superAdmins.map((a) => a.email), process.env.BACKUP_ALERT_EMAIL].filter(
    (email): email is string => Boolean(email),
  )

  try {
    const summary = await runWeeklyBackup(payload)

    if (recipients.length > 0) {
      await payload.sendEmail({
        to: recipients,
        subject: '[백업 완료] 주간 데이터 백업이 정상적으로 끝났습니다',
        html: `<p>생성 시각: ${new Date().toISOString()}</p>
<p>백업 파일(암호화됨): ${summary.backupPath} — Vercel 대시보드 Storage의 Blob 목록에서 내려받을 수 있습니다.</p>
<p>컬렉션별 문서 수: ${JSON.stringify(summary.collectionCounts)}</p>
<p>4주 지나 정리된 이전 백업: ${summary.deletedOldBackups.length}건</p>`,
      })
    }

    return NextResponse.json({ ok: true, ...summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    payload.logger.error({ err }, 'Weekly backup failed')

    if (recipients.length > 0) {
      await payload.sendEmail({
        to: recipients,
        subject: '[백업 실패] 주간 데이터 백업이 실패했습니다',
        html: `<p>시각: ${new Date().toISOString()}</p><p>오류: ${message}</p>`,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
