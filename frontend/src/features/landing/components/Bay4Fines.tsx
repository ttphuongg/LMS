import React from 'react'
import { ShelfBookCluster } from './BookSpineArtwork'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { DollarOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'

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
      rate: 'Theo biên bản thực tế',
      badge: 'Bảo quản tài sản',
      color: '#3B2A1E',
      icon: <ExclamationCircleOutlined style={{ fontSize: 21, color: '#B08D3C' }} />,
      desc: 'Trường hợp làm mất hoặc hư hại tài liệu, thủ thư lập biên bản đánh giá mức độ (Nhẹ, Nặng hoặc Mất hoàn toàn) để xác định khoản bồi hoàn phù hợp.',
      tip: 'Đối chiếu trực tiếp với giá trị tài liệu',
    },
    {
      title: 'Thanh Toán Trọn Gói 1 Lần',
      rate: 'Thu đủ 100% tại quầy',
      badge: 'Minh bạch 100%',
      color: '#1F3A2E',
      icon: <CheckCircleOutlined style={{ fontSize: 21, color: '#B08D3C' }} />,
      desc: 'Bạn đọc nộp đủ 100% giá trị phiếu phạt bằng tiền mặt tại quầy thủ thư hoặc chuyển khoản đối soát trực tiếp. Thủ thư xác nhận hoàn tất ngay.',
      tip: 'Lưu lịch sử phiếu phạt rõ ràng trên tài khoản',
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
