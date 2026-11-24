import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Select, Spin, Tag } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { notificationsApi } from '@/features/notifications/api'
import type { UserManagementItem } from '@/features/notifications/types'

interface ReaderSelectProps {
  value?: string | number
  onChange?: (value: string) => void
  onSelectUser?: (user: UserManagementItem | null) => void
  onClear?: () => void
  disabled?: boolean
  placeholder?: string
  style?: React.CSSProperties
  roleFilter?: string | number
}

export const ReaderSelect: React.FC<ReaderSelectProps> = ({
  value,
  onChange,
  onSelectUser,
  onClear,
  disabled = false,
  placeholder = 'Tìm bạn đọc theo Tên, Username, SĐT, Email hoặc ID thẻ...',
  style,
  roleFilter,
}) => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserManagementItem[]>([])
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqCounterRef = useRef(0)

  const searchUsers = useCallback(
    async (kw: string) => {
      const curReq = ++reqCounterRef.current
      try {
        setLoading(true)
        const res = await notificationsApi.getUsers({
          keyword: kw.trim() || undefined,
          role: roleFilter,
          page: 1,
          pageSize: 20,
        })
        if (curReq === reqCounterRef.current) {
          setUsers(res.items || [])
        }
      } catch {
        if (curReq === reqCounterRef.current) {
          setUsers([])
        }
      } finally {
        if (curReq === reqCounterRef.current) {
          setLoading(false)
        }
      }
    },
    [roleFilter]
  )

  // Tải danh sách bạn đọc ban đầu khi mở component
  useEffect(() => {
    searchUsers('')
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchUsers])

  const handleSearch = (text: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(text)
    }, 300)
  }

  const handleChange = (selectedId: string) => {
    if (!selectedId) {
      if (onChange) onChange('')
      if (onSelectUser) onSelectUser(null)
      if (onClear) onClear()
      return
    }

    if (onChange) onChange(selectedId)
    const selected = users.find((u) => u.id === String(selectedId)) || null
    if (onSelectUser) onSelectUser(selected)
  }

  return (
    <Select
      showSearch
      allowClear
      disabled={disabled}
      value={value ? String(value) : undefined}
      placeholder={placeholder}
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      onClear={() => {
        if (onChange) onChange('')
        if (onSelectUser) onSelectUser(null)
        if (onClear) onClear()
        searchUsers('')
      }}
      loading={loading}
      notFoundContent={loading ? <Spin size="small" /> : 'Không tìm thấy bạn đọc phù hợp'}
      style={{ width: '100%', ...style }}
      suffixIcon={<UserOutlined style={{ color: 'var(--muted-foreground)' }} />}
      options={users.map((u) => ({
        value: u.id,
        label: (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '2px 0',
            }}
          >
            <div>
              <strong style={{ color: 'var(--foreground)' }}>{u.fullName}</strong>
              <span style={{ color: 'var(--muted-foreground)', marginLeft: 6, fontSize: 12 }}>
                (@{u.username})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--muted-foreground)' }}>
                {u.phone ? `📞 ${u.phone}` : u.email}
              </span>
              <Tag
                bordered={false}
                style={{
                  background: 'var(--muted)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: 11,
                  marginRight: 0,
                }}
              >
                ID: {u.id}
              </Tag>
              {u.status === 'Locked' && (
                <Tag color="error" style={{ fontSize: 11, marginRight: 0 }}>
                  Bị khóa
                </Tag>
              )}
            </div>
          </div>
        ),
      }))}
    />
  )
}

