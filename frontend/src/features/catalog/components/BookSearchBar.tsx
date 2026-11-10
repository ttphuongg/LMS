import React from 'react'
import { Button, Input, Space, Tooltip } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { mutedText13Style, mutedTextStyle, radiusStyle } from '@/shared/styles/ui'

interface BookSearchBarProps {
  keyword: string
  onKeywordChange: (value: string) => void
  onSearch: () => void
  totalCount: number
  selectedCount?: number
  onViewSelected?: () => void
}

/** Thanh tìm kiếm + tổng số tài liệu ở đầu trang quản lý sách. */
export const BookSearchBar: React.FC<BookSearchBarProps> = ({
  keyword,
  onKeywordChange,
  onSearch,
  totalCount,
  selectedCount = 0,
  onViewSelected,
}) => (
  <div
    style={{
      background: 'var(--card)',
      padding: 'var(--sp-4)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      marginBottom: 'var(--sp-4)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 'var(--sp-3)',
    }}
  >
    <Space wrap>
      <Input
        placeholder="Tìm theo tên sách, tác giả, ISBN..."
        prefix={<SearchOutlined style={mutedTextStyle} />}
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        onPressEnter={onSearch}
        style={{ width: 300, borderRadius: 'var(--radius)' }}
      />
      <Button onClick={onSearch} style={radiusStyle}>Tìm kiếm</Button>
      {onViewSelected && (
        <Tooltip
          title={
            selectedCount === 0
              ? 'Chọn 1 tài liệu trong bảng để xem chi tiết'
              : selectedCount > 1
                ? 'Chỉ chọn 1 tài liệu để xem chi tiết'
                : ''
          }
        >
          <span>
            <Button
              icon={<EyeOutlined />}
              disabled={selectedCount !== 1}
              onClick={onViewSelected}
              style={radiusStyle}
            >
              Xem chi tiết
            </Button>
          </span>
        </Tooltip>
      )}
    </Space>

    <span style={mutedText13Style}>
      Tổng cộng: <strong>{totalCount}</strong> tài liệu
    </span>
  </div>
)
