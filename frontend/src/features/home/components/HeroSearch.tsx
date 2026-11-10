import React, { useState } from 'react'
import { Button, Input, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { CategoryDto } from '@/features/catalog'
import { greeting, givenName } from '../utils/selectors'
import { mutedTextStyle } from '@/shared/styles/ui'

interface HeroSearchProps {
  fullName?: string
  categories: CategoryDto[]
}

export const HeroSearch: React.FC<HeroSearchProps> = ({ fullName, categories }) => {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<string>('')

  const go = (kw: string, cat: string) => {
    const qs = new URLSearchParams()
    if (kw.trim()) qs.set('keyword', kw.trim())
    if (cat) qs.set('categoryId', cat)
    const s = qs.toString()
    navigate(s ? `/books?${s}` : '/books')
  }

  return (
    <section className="home-hero" aria-label="Tìm kiếm tài liệu">
      <h1>
        {greeting()}, {givenName(fullName)}
      </h1>
      <p>Tìm sách trong mục lục, theo dõi sách đang mượn và xem tài liệu mới của thư viện.</p>

      <form
        className="home-search-card"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          go(keyword, category)
        }}
      >
        <Select
          size="large"
          value={category}
          onChange={setCategory}
          aria-label="Chọn danh mục"
          options={[
            { label: 'Tất cả danh mục', value: '' },
            ...categories.map((c) => ({ label: c.name, value: c.id })),
          ]}
        />
        <Input
          size="large"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          prefix={<SearchOutlined style={mutedTextStyle} />}
          placeholder="Tên sách, tác giả, ISBN hoặc số hiệu phân loại"
          aria-label="Từ khóa tìm kiếm"
        />
        <Button type="primary" size="large" htmlType="submit">
          Tìm sách
        </Button>
      </form>

      {categories.length > 0 && (
        <div className="home-hero-chips">
          {categories.slice(0, 5).map((c) => (
            <button key={c.id} type="button" className="home-chip" onClick={() => go('', c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
