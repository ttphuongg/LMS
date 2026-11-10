import React, { useState } from 'react'
import { Layout, Row, Col, Space } from 'antd'
import { EnvironmentOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const { Footer: AntFooter } = Layout

import { BRAND } from '@/shared/constants/brand'

export const Footer: React.FC = () => {
  // State quản lý hiệu ứng hover cho các liên kết trong footer
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  const renderFooterLink = (to: string, label: string) => {
    const isHovered = hoveredLink === to
    return (
      <Link
        to={to}
        style={{
          color: isHovered ? '#B08D3C' : '#EAE0C9',
          textDecoration: 'none',
          transform: isHovered ? 'translateX(4px)' : 'none',
          transition: 'all 0.3s ease',
          display: 'inline-block',
        }}
        onMouseEnter={() => setHoveredLink(to)}
        onMouseLeave={() => setHoveredLink(null)}
      >
        {label}
      </Link>
    )
  }

  return (
    <AntFooter
      style={{
        background: '#1F3A2E', // [XANH RÊU] Đổi nền Footer thành xanh tối
        borderTop: '3px solid #8C2222', // [ĐỎ ĐÔ] Đường viền đỏ đô trên cùng tạo điểm nhấn chia cắt
        color: '#EAE0C9', // [BE/TRẮNG NGÀ MỜ] Màu chữ mô tả
        padding: 'var(--sp-8) var(--sp-6) var(--sp-6)',
        fontSize: 13,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={[32, 24]}>
          <Col xs={24} sm={12} md={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
              <img
                src={BRAND.logo}
                alt={BRAND.name}
                style={{
                  width: 32,
                  height: 32,
                  objectFit: 'contain',
                  display: 'block',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FBF7EC', // [TRẮNG NGÀ] Tên thương hiệu
                }}
              >
                {BRAND.uppercaseName}
              </span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.6, color: '#A3B1AA' /* Xanh xám nhạt */ }}>
              Hệ thống lưu trữ mục lục và quản lý lưu thông tài liệu học thuật theo tiêu chuẩn phân loại quốc tế. Không gian đọc và nghiên cứu tri thức văn minh.
            </p>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <h4
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 15,
                color: '#B08D3C', // [VÀNG ĐỒNG] Tiêu đề cột
                marginBottom: 'var(--sp-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Liên hệ & Giờ phục vụ
            </h4>
            <Space orientation="vertical" size={6} style={{ color: '#EAE0C9' }}>
              <div>
                <EnvironmentOutlined style={{ marginRight: 6, color: '#B08D3C' }} /> Tầng 2-5, Tòa nhà Trung tâm Tri thức
              </div>
              <div>
                <PhoneOutlined style={{ marginRight: 6, color: '#B08D3C' }} /> (024) 3869 1234
              </div>
              <div>
                <MailOutlined style={{ marginRight: 6, color: '#B08D3C' }} /> thuvien@library.edu.vn
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#FBF7EC', fontWeight: 600 }}>
                Mở cửa: Thứ Hai – Thứ Bảy (08:00 – 21:00)
              </div>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <h4
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 15,
                color: '#B08D3C', // [VÀNG ĐỒNG] Tiêu đề cột
                marginBottom: 'var(--sp-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Liên kết nhanh
            </h4>
            <Space orientation="vertical" size={4}>
              {renderFooterLink('/books', 'Mục lục tra cứu tài liệu')}
              {renderFooterLink('/login', 'Cổng thông tin Bạn đọc')}
              {renderFooterLink('/#rules', 'Nội quy mượn trả & Biểu phí phạt')}
            </Space>
          </Col>
        </Row>

        <div
          style={{
            marginTop: 'var(--sp-6)',
            paddingTop: 'var(--sp-4)',
            borderTop: '1px solid #14281f', // Viền ngăn cách xanh rất tối
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--sp-2)',
            fontSize: 12,
            color: '#A3B1AA' // Màu chữ bản quyền xám nhạt
          }}
        >
          <span>© 2026 Hệ thống Quản lý Thư viện.</span>
          <span style={{ color: '#B08D3C', fontWeight: 500 }}>Phiên bản Frontend v1.0.0</span>
        </div>
      </div>
    </AntFooter>
  )
}
