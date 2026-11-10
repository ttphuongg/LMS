import React from 'react'
import { ShelfBookCluster } from './BookSpineArtwork'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { DollarOutlined, ExclamationCircleOutlined, QrcodeOutlined } from '@ant-design/icons'

export const Bay4Fines: React.FC = () => {
  const fineCards = [
    {
      title: 'Phạt Trễ Hạn Trả Sách',
      rate: `${LIBRARY_RULES.finePerDayVND.toLocaleString('vi-VN')} ₫ / ngày`,
      badge: 'Quá hạn mượn',
      color: '#7A2E2B',
      icon: <DollarOutlined style={{ fontSize: 21, color: '#DECFAA' }} />,
      desc: 'Mỗi ngày trễ hạn tính từ sau ngày hết hạn được ghi trên phiếu mượn. Khuyến khích bạn đọc gia hạn trực tuyến để tránh phát sinh chi phí.',
      tip: 'Tự động tính theo từng đầu tài liệu',
    },
    {
      title: 'Bồi Thường Mất / Hư Hỏng',
      rate: '100% Giá bìa + 20.000 ₫',
      badge: 'Bảo quản tài sản',
      color: '#3B2A1E',
      icon: <ExclamationCircleOutlined style={{ fontSize: 21, color: '#B08D3C' }} />,
      desc: 'Trường hợp làm mất hoặc làm rách nát tài liệu không thể phục chế, bạn đọc bồi hoàn theo giá trị niêm yết hoặc bổ sung bản sao mới tương đương.',
      tip: 'Phí nghiệp vụ đóng gáy & cấp mã mới',
    },
    {
      title: 'Thanh Toán Không Tiền Mặt',
      rate: 'VietQR / Chuyển Khoản',
      badge: 'Minh bạch 100%',
      color: '#1F3A2E',
      icon: <QrcodeOutlined style={{ fontSize: 21, color: '#B08D3C' }} />,
      desc: 'Hệ thống tích hợp mã QR chuyển khoản ngân hàng chuẩn NAPAS247 ngay trên trang "Tiền phạt của tôi". Thủ thư đối soát và xóa nợ tức thì.',
      tip: 'Biên lai điện tử lưu trữ vĩnh viễn',
    },
  ]

  return (
    <section className="shelf-bay shelf-bay-4" aria-labelledby="bay-4-heading">
      <div className="bay-header-wrap">
        <div className="bay-ddc-code">500 — 699</div>
        <h2 id="bay-4-heading" className="bay-title">
          Biểu Phí & Bồi Hoàn
        </h2>
        <p className="bay-desc">
          Chính sách tài chính minh bạch nhằm bảo tồn tài nguyên học thuật và nâng cao ý thức giữ gìn sách chung.
        </p>
      </div>

      <div className="bay-shelf-stage">
        <div className="shelf-books-row" role="region" aria-label="Biểu phí phạt và bồi hoàn">
          <div className="shelf-filler-left">
            <ShelfBookCluster count={6} />
          </div>

          {/* 3 Fine Policy Ledgers */}
          <div className="fine-ledgers-container" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-6)' }}>
            {fineCards.map((fc, i) => (
              <div
                key={i}
                className="fine-ledger-card"
                style={{
                  width: 250,
                  height: 300,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderTop: `3px solid ${fc.color}`,
                  borderRadius: 'var(--radius)',
                  padding: 'var(--sp-6) var(--sp-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'transform 0.25s ease, border-color 0.25s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: fc.color,
                        background: 'var(--muted)',
                        padding: '2px var(--sp-2)',
                        borderRadius: 'var(--radius-sm)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {fc.badge}
                    </span>
                    <div style={{ background: fc.color, padding: 'var(--sp-1) var(--sp-2)', borderRadius: 'var(--radius-sm)' }}>
                      {fc.icon}
                    </div>
                  </div>

                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 16,
                      color: 'var(--foreground)',
                      margin: '0 0 var(--sp-2)',
                      fontWeight: 700,
                    }}
                  >
                    {fc.title}
                  </h3>

                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 17,
                      fontWeight: 700,
                      color: fc.color,
                      marginBottom: 'var(--sp-3)',
                    }}
                  >
                    {fc.rate}
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--muted-foreground)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {fc.desc}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px dashed var(--border)',
                    paddingTop: 'var(--sp-2)',
                    fontSize: 11,
                    color: 'var(--muted-foreground)',
                    fontStyle: 'italic',
                  }}
                >
                  {fc.tip}
                </div>
              </div>
            ))}
          </div>

          <div className="shelf-filler-right">
            <ShelfBookCluster count={6} />
          </div>
        </div>

        <div className="wooden-shelf-bar" />
      </div>
    </section>
  )
}
