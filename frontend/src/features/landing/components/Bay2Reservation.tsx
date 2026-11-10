import React from 'react'
import { ShelfBookCluster } from './BookSpineArtwork'
import { SearchOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'

export const Bay2Reservation: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Tra Cứu & Chọn Sách',
      height: 290,
      width: 255,
      bg: '#1F3A2E',
      gold: '#B08D3C',
      icon: <SearchOutlined style={{ fontSize: 24, color: '#B08D3C' }} />,
      badge: 'DDC 000 — 999',
      desc: 'Tìm kiếm tài liệu học thuật theo tên sách, tác giả hoặc từ khóa. Nếu tất cả bản sao tại chỗ đang được lưu hành, bấm nút "Đặt trước".',
      detail: 'Không giới hạn số lượt tra cứu trực tuyến',
    },
    {
      num: '02',
      title: 'Hệ Thống Giữ Chỗ',
      height: 310, // Highest book
      width: 260,
      bg: '#7A2E2B',
      gold: '#DECFAA',
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: '#DECFAA' }} />,
      badge: 'Ưu tiên giữ trong 48 giờ',
      desc: 'Hệ thống tự động thông báo ngay khi có độc giả hoàn trả. Thủ thư giữ riêng tài liệu tại quầy phục vụ cho bạn trong vòng 48 giờ.',
      detail: 'Thông báo qua chuông hệ thống & email',
    },
    {
      num: '03',
      title: 'Nhận Sách Tại Quầy',
      height: 300,
      width: 250,
      bg: '#3B2A1E',
      gold: '#B08D3C',
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#B08D3C' }} />,
      badge: 'Xuất trình thẻ bạn đọc',
      desc: 'Đến quầy thủ thư, xuất trình mã thẻ bạn đọc hoặc xác nhận đặt chỗ trên điện thoại để hoàn tất phiếu mượn và nhận tài liệu.',
      detail: 'Quy trình đối soát nhanh trong 60 giây',
    },
  ]

  return (
    <section className="shelf-bay shelf-bay-2" aria-labelledby="bay-2-heading">
      <div className="bay-header-wrap">
        <div className="bay-ddc-code">100 — 299</div>
        <h2 id="bay-2-heading" className="bay-title">
          Quy Trình Đặt Trước
        </h2>
        <p className="bay-desc">
          3 bước đơn giản để giữ riêng tài liệu quý ngay cả khi toàn bộ bản sao tại chỗ đang được mượn đọc.
        </p>
      </div>

      <div className="bay-shelf-stage">
        <div className="shelf-books-row" role="region" aria-label="3 bước đặt trước">
          {/* Decorative books on left */}
          <div className="shelf-filler-left">
            <ShelfBookCluster count={5} />
          </div>

          {/* 3 Steps represented by 3 Standing Books with Different Heights */}
          <div className="step-books-container" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-6)' }}>
            {steps.map((st) => (
              <div
                key={st.num}
                className="step-standing-book"
                style={{
                  width: st.width,
                  height: st.height,
                  background: st.bg,
                  border: `1.5px solid ${st.gold}`,
                  borderRadius: 'var(--radius)',
                  padding: 'var(--sp-6) var(--sp-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
                }}
              >
                {/* Step Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                    <div className="step-book-number" style={{ color: st.gold, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700 }}>
                      {st.num}
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--sp-1) var(--sp-2)', borderRadius: 'var(--radius-sm)' }}>
                      {st.icon}
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 700,
                      color: st.gold,
                      border: `1px solid ${st.gold}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px var(--sp-2)',
                      marginBottom: 'var(--sp-2)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {st.badge}
                  </span>

                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 18,
                      color: '#FBF7EC',
                      margin: '0 0 var(--sp-2)',
                      fontWeight: 700,
                    }}
                  >
                    {st.title}
                  </h3>

                  <p
                    style={{
                      fontSize: 12,
                      color: '#ECE3CF',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {st.desc}
                  </p>
                </div>

                {/* Step Footer Note */}
                <div
                  style={{
                    paddingTop: 'var(--sp-3)',
                    borderTop: `1px dashed ${st.gold}`,
                    fontSize: 11,
                    color: st.gold,
                    fontStyle: 'italic',
                  }}
                >
                  {st.detail}
                </div>
              </div>
            ))}
          </div>

          {/* Decorative books on right */}
          <div className="shelf-filler-right">
            <ShelfBookCluster count={6} />
          </div>
        </div>

        {/* Shelf bar */}
        <div className="wooden-shelf-bar" />
      </div>
    </section>
  )
}
