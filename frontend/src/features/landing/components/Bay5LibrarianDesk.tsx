import React from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/identity'
import { ShelfBookCluster } from './BookSpineArtwork'
import {
  IdcardOutlined,
  LoginOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  BookOutlined,
} from '@ant-design/icons'

export const Bay5LibrarianDesk: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  return (
    <section className="shelf-bay shelf-bay-5" aria-labelledby="bay-5-heading">
      <div className="bay-header-wrap">
        <div className="bay-ddc-code">700 — 999</div>
        <h2 id="bay-5-heading" className="bay-title">
          Quầy Dịch Vụ Thủ Thư
        </h2>
        <p className="bay-desc">
          Cổng thông tin phục vụ, cấp thẻ bạn đọc và hỗ trợ tra cứu học thuật trực tiếp tại không gian thư viện.
        </p>
      </div>

      <div className="bay-shelf-stage">
        <div className="shelf-books-row" role="region" aria-label="Quầy dịch vụ thủ thư">
          <div className="shelf-filler-left">
            <ShelfBookCluster count={5} />
          </div>

          {/* Librarian Service Desk Representation Card */}
          <div
            className="librarian-desk-card"
            style={{
              width: 560,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 'var(--sp-8) var(--sp-6)',
              position: 'relative',
            }}
          >
            {/* Top Service Badge */}
            <div
              style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--primary)',
                color: 'var(--card)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--sp-1) var(--sp-4)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Bàn Hướng Dẫn & Tiếp Nhận Độc Giả
            </div>

            {/* Operating Information - Flat border divided layout, NO card in card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--sp-4)',
                marginBottom: 'var(--sp-5)',
                marginTop: 'var(--sp-2)',
              }}
            >
              <div
                style={{
                  borderLeft: '2px solid var(--border-strong)',
                  paddingLeft: 'var(--sp-3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'var(--primary)', fontWeight: 600, fontSize: 13, marginBottom: 'var(--sp-1)' }}>
                  <ClockCircleOutlined />
                  Giờ Mở Cửa Phục Vụ
                </div>
                <div style={{ fontSize: 12, color: 'var(--foreground)', fontWeight: 600 }}>Thứ Hai — Thứ Bảy: 8:00 - 21:00</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Nghỉ Chủ Nhật & các ngày lễ quốc gia</div>
              </div>

              <div
                style={{
                  borderLeft: '2px solid var(--border-strong)',
                  paddingLeft: 'var(--sp-3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'var(--primary)', fontWeight: 600, fontSize: 13, marginBottom: 'var(--sp-1)' }}>
                  <EnvironmentOutlined />
                  Địa Điểm Quầy
                </div>
                <div style={{ fontSize: 12, color: 'var(--foreground)', fontWeight: 600 }}>Tầng 1 — Sảnh Trung tâm Libri</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Trực tiếp hỗ trợ tra cứu & mượn trả</div>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                padding: 'var(--sp-3) 0',
                fontSize: 12,
                color: 'var(--foreground)',
                marginBottom: 'var(--sp-6)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
              }}
            >
              <PhoneOutlined style={{ color: 'var(--accent)' }} />
              <span>Đường dây nóng hỗ trợ độc giả: <strong>(028) 3822 1234</strong> | support@library.edu.vn</span>
            </div>

            {/* Action Buttons: Login & Register */}
            {isAuthenticated && user ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 var(--sp-4)', color: 'var(--primary)', fontWeight: 600 }}>
                  Xin chào <strong>{user.fullName}</strong> ({user.role === 'Reader' ? 'Bạn đọc' : user.role === 'Librarian' ? 'Thủ thư' : 'Quản trị viên'})
                </p>
                <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<BookOutlined />}
                    onClick={() => navigate('/books')}
                    style={{ background: 'var(--primary)', borderColor: 'var(--border-strong)', fontWeight: 600, height: 44, borderRadius: 'var(--radius)' }}
                  >
                    Xem Mục Lục Sách
                  </Button>
                  <Button
                    size="large"
                    onClick={() => navigate('/profile')}
                    style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)', fontWeight: 600, height: 44, borderRadius: 'var(--radius)' }}
                  >
                    Hồ Sơ Cá Nhân
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<LoginOutlined />}
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'var(--primary)',
                    borderColor: 'var(--primary)',
                    color: 'var(--card)',
                    fontWeight: 600,
                    height: 44,
                    fontSize: 14,
                    borderRadius: 'var(--radius)',
                  }}
                >
                  Đăng Nhập
                </Button>

                <Button
                  size="large"
                  block
                  icon={<IdcardOutlined />}
                  onClick={() => navigate('/register')}
                  style={{
                    background: 'var(--card)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--foreground)',
                    fontWeight: 600,
                    height: 44,
                    fontSize: 14,
                    borderRadius: 'var(--radius)',
                  }}
                >
                  Đăng Ký Thẻ Thư Viện
                </Button>
              </div>
            )}
          </div>

          <div className="shelf-filler-right" style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <ShelfBookCluster count={7} />

            {/* Chậu cây di chuyển từ Bay 2 sang góc phải kệ Bay 5 */}
            <div className="shelf-potted-plant" style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', marginLeft: 20 }}>
              <svg width="180" height="260" viewBox="0 100 220 312" fill="none" aria-label="Chậu cây trang trí góc kệ">
                {/* Ceramic Urn Planter */}
                <path
                  d="M70,330 L150,330 L140,410 L80,410 Z"
                  fill="#523223"
                  stroke="#2A170F"
                  strokeWidth="3"
                />
                <ellipse cx="110" cy="330" rx="42" ry="10" fill="#6A422F" stroke="#2A170F" strokeWidth="2" />

                {/* Lush Monstera Leaves in deep greens */}
                <path
                  d="M110,320 Q90,240 40,210 Q60,190 100,240 Q105,270 110,320"
                  fill="#14281E"
                  stroke="#0A1811"
                  strokeWidth="2"
                />
                <path
                  d="M110,320 Q130,220 180,180 Q190,210 135,260 Q120,290 110,320"
                  fill="#183125"
                  stroke="#0A1811"
                  strokeWidth="2"
                />
                <path
                  d="M110,300 Q110,160 110,110 Q140,140 120,220 Q115,260 110,300"
                  fill="#1E3C2E"
                  stroke="#0A1811"
                  strokeWidth="2"
                />
                <path
                  d="M110,310 Q80,260 30,270 Q40,250 85,260 Q100,280 110,310"
                  fill="#112219"
                  stroke="#0A1811"
                  strokeWidth="2"
                />
                <path
                  d="M110,310 Q140,260 195,280 Q180,250 135,260 Q120,280 110,310"
                  fill="#162D22"
                  stroke="#0A1811"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="wooden-shelf-bar" />
      </div>
    </section>
  )
}
