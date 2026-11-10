import React from 'react'
import { ShelfBookCluster } from './BookSpineArtwork'
import { LIBRARY_RULES } from '@/shared/constants/rules'
import { CalendarOutlined, RedoOutlined, ReadOutlined, SafetyCertificateOutlined } from '@ant-design/icons'

export const Bay3BorrowRules: React.FC = () => {
  const ruleCards = [
    {
      icon: <CalendarOutlined style={{ fontSize: 22, color: '#B08D3C' }} />,
      value: `${LIBRARY_RULES.standardBorrowDays} ngày`,
      label: 'Hạn mượn tiêu chuẩn',
      desc: 'Áp dụng cho mọi đầu sách trong kho tài liệu lưu hành. Bạn đọc có 14 ngày trọn vẹn để nghiên cứu chuyên sâu.',
      badge: 'Thời hạn mượn',
      color: '#1F3A2E',
    },
    {
      icon: <RedoOutlined style={{ fontSize: 22, color: '#DECFAA' }} />,
      value: `${LIBRARY_RULES.maxRenewTimes} lần (+${LIBRARY_RULES.renewalExtensionDays} ngày)`,
      label: 'Gia hạn trực tuyến',
      desc: 'Mỗi tài liệu được gia hạn tối đa 2 lần nếu chưa có độc giả khác đặt trước. Mỗi lần cộng thêm 7 ngày.',
      badge: 'Chủ động gia hạn',
      color: '#7A2E2B',
    },
    {
      icon: <ReadOutlined style={{ fontSize: 22, color: '#B08D3C' }} />,
      value: `${LIBRARY_RULES.maxConcurrentLoans} cuốn`,
      label: 'Mượn cùng lúc tối đa',
      desc: 'Mỗi bạn đọc được mượn song song đến 5 cuốn để đối chiếu tài liệu và thực hiện đồ án, luận văn.',
      badge: 'Hạn mức thẻ',
      color: '#3B2A1E',
    },
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: 22, color: '#DECFAA' }} />,
      value: `${LIBRARY_RULES.reservationHoldHours} giờ`,
      label: 'Thời gian giữ sách đặt trước',
      desc: 'Tài liệu đặt trước khi về quầy sẽ được lưu riêng trong 48 giờ để bạn đọc chủ động sắp xếp thời gian đến nhận.',
      badge: 'Đặc quyền giữ chỗ',
      color: '#2A2118',
    },
  ]

  return (
    <section className="shelf-bay shelf-bay-3" aria-labelledby="bay-3-heading">
      <div className="bay-header-wrap">
        <div className="bay-ddc-code">300 — 499</div>
        <h2 id="bay-3-heading" className="bay-title">
          Mượn & Gia Hạn
        </h2>
        <p className="bay-desc">
          Quy chuẩn lưu thông minh bạch, đồng bộ và tiện lợi hóa tối đa thông qua cổng thông tin trực tuyến.
        </p>
      </div>

      <div className="bay-shelf-stage">
        <div className="shelf-books-row" role="region" aria-label="Quy định mượn và gia hạn">
          <div className="shelf-filler-left">
            <ShelfBookCluster count={5} />
          </div>

          {/* 4 Rule Ledger Folios resting on the shelf */}
          <div className="rule-cards-row" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-5)' }}>
            {ruleCards.map((rc, i) => (
              <div
                key={i}
                className="rule-ledger-card"
                style={{
                  width: 220,
                  height: 285,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 'var(--sp-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
                }}
              >
                {/* Vintage Top Spine Accent Bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                    background: rc.color,
                    borderRadius: '3px 3px 0 0',
                  }}
                />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#6B5B4B',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {rc.badge}
                    </span>
                    {rc.icon}
                  </div>

                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 22,
                      fontWeight: 700,
                      color: rc.color,
                      marginBottom: 6,
                      lineHeight: 1.2,
                    }}
                  >
                    {rc.value}
                  </div>

                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#2A2118',
                      marginBottom: 8,
                    }}
                  >
                    {rc.label}
                  </div>

                  <p
                    style={{
                      fontSize: 11.5,
                      color: '#6B5B4B',
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {rc.desc}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px dashed #DECFAA',
                    paddingTop: 8,
                    fontSize: 10,
                    color: '#8A8174',
                    letterSpacing: '0.02em',
                  }}
                >
                  Điều lệ lưu thông Libri
                </div>
              </div>
            ))}
          </div>

          <div className="shelf-filler-right">
            <ShelfBookCluster count={3} />
          </div>
        </div>

        <div className="wooden-shelf-bar" />
      </div>
    </section>
  )
}
