import React, { useEffect, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

const CSS = `
  .header-search {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 260px;
    margin-left: 16px;
    padding: 0 12px;
    height: 36px;
    border-radius: var(--radius);
    border: 1px solid rgba(176, 141, 60, 0.55);
    background: rgba(251, 247, 236, 0.1);
    transition: border-color 0.2s ease, background 0.2s ease;
  }
  .header-search:focus-within {
    border-color: #B08D3C;
    background: rgba(251, 247, 236, 0.16);
  }
  .header-search input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: #FBF7EC;
    font: inherit;
    font-size: 14px;
  }
  .header-search input::placeholder { color: rgba(251, 247, 236, 0.6); }
  .header-search-icon { color: #B08D3C; }
  .header-search-toggle {
    display: none;
    margin-left: 8px;
    width: 36px;
    height: 36px;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: #B08D3C;
    font-size: 18px;
    border-radius: var(--radius);
  }
  .header-search-toggle:focus-visible { outline: 2px solid #B08D3C; }
  .header-search-panel {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    z-index: 999;
    padding: 8px 16px 12px;
    background: #1F3A2E;
    border-bottom: 1px solid #14281f;
  }
  .header-search-panel .header-search { width: 100%; margin-left: 0; }
  @media (max-width: 1100px) {
    .header-search-desktop { display: none; }
    .header-search-toggle { display: inline-flex; }
  }
`

/**
 * Ô tìm kiếm trên Header (chỉ cho người đã đăng nhập), thay cho mục menu "Tra cứu".
 * Enter -> /books?keyword=...; để trống -> /books (toàn bộ mục lục).
 * Màn hình hẹp: thu thành biểu tượng kính lúp, bấm để mở ô tìm dưới Header.
 */
export const HeaderSearch: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [value, setValue] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)

  const urlKeyword = location.pathname === '/books' ? params.get('keyword') || '' : ''

  // Giữ ô tìm khớp với từ khóa đang xem; rời trang mục lục thì xóa
  useEffect(() => {
    setValue(urlKeyword)
  }, [urlKeyword, location.pathname])

  useEffect(() => {
    setPanelOpen(false)
  }, [location.pathname, location.search])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const kw = value.trim()
    navigate(kw ? `/books?keyword=${encodeURIComponent(kw)}` : '/books')
    setPanelOpen(false)
  }

  const field = (autoFocus?: boolean) => (
    <>
      <SearchOutlined className="header-search-icon" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tìm sách, tác giả, ISBN..."
        aria-label="Tìm sách trong mục lục"
        autoFocus={autoFocus}
      />
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <form role="search" className="header-search header-search-desktop" onSubmit={submit}>
        {field()}
      </form>
      <button
        type="button"
        className="header-search-toggle"
        aria-label="Tìm sách"
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen((o) => !o)}
      >
        <SearchOutlined />
      </button>
      {panelOpen && (
        <form role="search" className="header-search-panel" onSubmit={submit}>
          <div className="header-search">{field(true)}</div>
        </form>
      )}
    </>
  )
}
