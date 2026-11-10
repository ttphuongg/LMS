import React, { useMemo, useState } from 'react'
import { useAuth } from '@/features/identity'
import { RenewModal } from '@/features/circulation'
import type { LoanDetailDto } from '@/features/circulation'
import '../home.css'
import { useHomeData } from '../hooks/useHomeData'
import {
  countByCategory,
  getActiveDetails,
  pickNewest,
  pickPopular,
  pickRecommended,
  summarizeFines,
  summarizeLoans,
  summarizeReservations,
} from '../utils/selectors'
import { HeroSearch } from '../components/HeroSearch'
import { StatusStrip } from '../components/StatusStrip'
import { MyLoansPanel } from '../components/MyLoansPanel'
import { CategoryGrid } from '../components/CategoryGrid'
import { BookShelf } from '../components/BookShelf'
import { LibraryInfoPanel, NotificationsPanel } from '../components/SidePanels'

// 6 cuốn/kệ: chia hết cho cả lưới 2 và 3 cột nên hàng cuối luôn đầy
const SHELF_SIZE = 6

export const HomePage: React.FC = () => {
  const { user } = useAuth()
  const data = useHomeData()
  const [renewTarget, setRenewTarget] = useState<LoanDetailDto | null>(null)

  const active = useMemo(() => getActiveDetails(data.slips), [data.slips])
  const loanSummary = useMemo(() => summarizeLoans(active), [active])
  const fineSummary = useMemo(() => summarizeFines(data.fines), [data.fines])
  const resSummary = useMemo(() => summarizeReservations(data.reservations), [data.reservations])

  const newest = useMemo(() => pickNewest(data.books, SHELF_SIZE), [data.books])
  const popular = useMemo(() => pickPopular(data.books, SHELF_SIZE), [data.books])
  const recommended = useMemo(
    () => pickRecommended(data.books, data.slips, [...newest, ...popular].map((b) => b.id), SHELF_SIZE),
    [data.books, data.slips, newest, popular],
  )

  // Chỉ hiện số liệu theo danh mục / "có thể mượn ngay" khi đã tải đủ toàn bộ kho sách
  const poolIsComplete = data.totalBooks > 0 && data.books.length >= data.totalBooks
  const counts = useMemo(
    () => (poolIsComplete ? countByCategory(data.books) : undefined),
    [poolIsComplete, data.books],
  )
  const availableTitles = poolIsComplete ? data.books.filter((b) => b.availableCopies > 0).length : undefined

  return (
    <div className="home">
      <HeroSearch fullName={user?.fullName} categories={data.categories} />

      {data.partialError && !data.loading && (
        <div className="home-notice" role="status">
          Một số thông tin chưa tải được.{' '}
          <button type="button" className="home-link" onClick={data.reload}>
            Thử lại
          </button>
        </div>
      )}

      <StatusStrip loans={loanSummary} reservations={resSummary} fines={fineSummary} />

      <div className="home-layout">
        <div className="home-main">
          <MyLoansPanel active={active} onRenew={setRenewTarget} />

          <CategoryGrid categories={data.categories} counts={counts} />

          <BookShelf
            title={recommended.personalized ? 'Gợi ý theo lịch sử mượn' : 'Có thể bạn quan tâm'}
            subtitle={recommended.personalized ? 'Cùng tác giả hoặc cùng danh mục với sách bạn đã mượn' : undefined}
            books={recommended.items}
            loading={data.loading}
          />
          <BookShelf title="Sách mới" books={newest} loading={data.loading} />
          <BookShelf title="Sách nổi bật" subtitle="Được bạn đọc mượn nhiều" books={popular} loading={data.loading} />
        </div>

        <aside className="home-aside">
          <NotificationsPanel items={data.notifications} />
          <LibraryInfoPanel totalBooks={data.totalBooks} availableTitles={availableTitles} />
        </aside>
      </div>

      <RenewModal
        open={renewTarget !== null}
        loanDetail={renewTarget}
        onClose={() => setRenewTarget(null)}
        onSuccess={data.reload}
      />
    </div>
  )
}
