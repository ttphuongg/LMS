import React, { useEffect, useState } from 'react'
import { Table, Input, Select, Button, Space, Modal, Form, Switch, Tooltip } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined, EditOutlined, UserOutlined } from '@ant-design/icons'
import { notificationsApi } from '../api'
import type { UserManagementItem } from '../types'
import { useAuth } from '@/features/identity'
import { PageHeader } from '@/shared/components/PageHeader'
import { SpineTag } from '@/shared/components/SpineTag'
import { formatDate, getErrorMessage } from '@/shared/utils/format'
import { useStableCallback, useRequestGuard } from '@/shared/hooks'
import { modalTitleStyle, mutedText12Style, mutedText13Style, mutedTextStyle, primaryButtonStyle, radiusStyle, strongTextStyle } from '@/shared/styles/ui'

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserManagementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal đổi role
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserManagementItem | null>(null)
  const [newRole, setNewRole] = useState<'Reader' | 'Librarian' | 'Admin'>('Reader')
  const [updatingRole, setUpdatingRole] = useState(false)

  const guard = useRequestGuard()

  // ISSUE-AUTH-002: Nhận diện chính xác tài khoản đang đăng nhập bằng so sánh ID chuẩn hóa string
  const isSelf = (userOrId: UserManagementItem | string | number | null | undefined): boolean => {
    if (!currentUser || !userOrId) return false
    const targetId = typeof userOrId === 'object' ? userOrId.id : String(userOrId)
    return String(currentUser.id) === String(targetId)
  }

  const fetchUsers = useStableCallback(async () => {
    const reqId = guard.next()
    try {
      setLoading(true)
      const res = await notificationsApi.getUsers({
        keyword: keyword.trim() || undefined,
        role: roleFilter,
        page,
        pageSize,
      })
      if (!guard.isLatest(reqId)) return
      setUsers(res.items)
      setTotalCount(res.totalCount)
    } finally {
      if (guard.isLatest(reqId)) setLoading(false)
    }
  })

  useEffect(() => {
    fetchUsers()
  }, [page, pageSize, roleFilter, fetchUsers])

  // Về trang 1 rồi để effect tự tải; nếu đã ở trang 1 thì tải ngay (tránh gọi API hai lần với `page` cũ)
  const applyFilter = () => {
    if (page === 1) fetchUsers()
    else setPage(1)
  }

  const handleOpenRoleModal = (u: UserManagementItem) => {
    // ISSUE-AUTH-002: Chặn mở modal hạ quyền tài khoản của chính mình
    if (isSelf(u)) {
      message.warning('Bạn không thể tự thay đổi vai trò của chính mình!')
      return
    }
    setSelectedUser(u)
    setNewRole(u.role)
    setRoleModalOpen(true)
  }

  const handleConfirmRole = async () => {
    if (!selectedUser) return
    // ISSUE-AUTH-002: Guard kiểm tra ID trước khi gửi request đổi vai trò
    if (isSelf(selectedUser)) {
      message.error('Bạn không thể tự thay đổi vai trò của chính mình!')
      setRoleModalOpen(false)
      return
    }

    try {
      setUpdatingRole(true)
      await notificationsApi.updateUserRole(selectedUser.id, newRole)
      message.success(`Đã cập nhật vai trò của ${selectedUser.fullName} thành ${newRole}!`)
      setRoleModalOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi cập nhật vai trò'))
    } finally {
      setUpdatingRole(false)
    }
  }

  const handleToggleStatus = async (user: UserManagementItem, checked: boolean) => {
    // ISSUE-AUTH-002: Guard kiểm tra ID trước khi gửi request khóa/mở tài khoản
    if (isSelf(user)) {
      message.warning('Bạn không thể tự khóa tài khoản của chính mình!')
      return
    }

    try {
      await notificationsApi.updateUserStatus(user.id, checked)
      message.success(`Đã ${checked ? 'kích hoạt' : 'tạm khóa'} tài khoản ${user.fullName}`)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: checked } : u))
      )
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi cập nhật trạng thái'))
    }
  }

  const columns: ColumnsType<UserManagementItem> = [
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string, r) => {
        const self = isSelf(r)
        return (
          <div>
            <Space orientation="horizontal" size="small">
              <span style={strongTextStyle}>{name}</span>
              {self && (
                <SpineTag variant="primary">
                  <UserOutlined style={{ marginRight: 4 }} />
                  Tài khoản của bạn
                </SpineTag>
              )}
            </Space>
            <div style={mutedText12Style}>{r.email}</div>
          </div>
        )
      },
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (p: string) => p || '—',
    },
    {
      title: 'Vai trò hệ thống',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: 'Reader' | 'Librarian' | 'Admin') => {
        if (role === 'Admin') return <SpineTag variant="danger">Quản trị viên</SpineTag>
        if (role === 'Librarian') return <SpineTag variant="primary">Thủ thư</SpineTag>
        return <SpineTag variant="neutral">Bạn đọc</SpineTag>
      },
    },
    {
      title: 'Trạng thái hoạt động',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 170,
      render: (active: boolean, r) => {
        const self = isSelf(r)
        const switchNode = (
          <Switch
            checked={active}
            disabled={self || !currentUser}
            onChange={(checked) => handleToggleStatus(r, checked)}
            style={{ backgroundColor: active ? 'var(--primary)' : undefined }}
          />
        )

        return (
          <Space>
            {self ? (
              <Tooltip title="Không thể tự khóa tài khoản của chính mình">
                <span>{switchNode}</span>
              </Tooltip>
            ) : (
              switchNode
            )}
            <span style={{ fontSize: 12, color: active ? 'var(--primary)' : 'var(--destructive)' }}>
              {active ? 'Đang mở' : 'Đã khóa'}
            </span>
          </Space>
        )
      },
    },
    {
      title: 'Ngày gia nhập',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Phân quyền',
      key: 'action',
      width: 130,
      render: (_, r) => {
        const self = isSelf(r)
        const btnNode = (
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={self || !currentUser}
            onClick={() => handleOpenRoleModal(r)}
            style={{
              borderColor: self ? undefined : 'var(--border-strong)',
              color: self ? undefined : 'var(--primary)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Đổi vai trò
          </Button>
        )

        if (self) {
          return (
            <Tooltip title="Không thể tự thay đổi vai trò của chính mình">
              <span>{btnNode}</span>
            </Tooltip>
          )
        }

        return btnNode
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Quản Lý Tài Khoản & Phân Quyền Người Dùng"
        subtitle="Quản lý danh sách thành viên thư viện, cấp quyền Thủ thư hoặc Quản trị viên"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Người dùng' },
        ]}
      />

      <div
        style={{
          background: 'var(--card)',
          padding: 'var(--sp-4)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
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
            placeholder="Tìm theo tên, email..."
            prefix={<SearchOutlined style={mutedTextStyle} />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={applyFilter}
            style={{ width: 280 }}
          />

          <Select
            placeholder="Tất cả vai trò"
            allowClear
            value={roleFilter}
            onChange={(val) => {
              setRoleFilter(val)
              setPage(1)
            }}
            style={{ width: 160 }}
            options={[
              { label: 'Bạn đọc (Reader)', value: 'Reader' },
              { label: 'Thủ thư (Librarian)', value: 'Librarian' },
              { label: 'Quản trị viên (Admin)', value: 'Admin' },
            ]}
          />

          <Button onClick={applyFilter}>Lọc</Button>
        </Space>

        <span style={mutedText13Style}>
          Tổng số: <strong>{totalCount}</strong> tài khoản
        </span>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        bordered
        scroll={{ x: 800 }}
        pagination={{
          current: page,
          pageSize,
          total: totalCount,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      <Modal
        title={
          <span style={modalTitleStyle}>
            Phân Quyền Vai Trò Người Dùng
          </span>
        }
        open={roleModalOpen}
        onOk={handleConfirmRole}
        confirmLoading={updatingRole}
        onCancel={() => setRoleModalOpen(false)}
        okText="Cập nhật vai trò"
        cancelText="Đóng"
        okButtonProps={{ style: primaryButtonStyle }}
        cancelButtonProps={{ style: radiusStyle }}
      >
        <div style={{ marginBottom: 'var(--sp-4)', padding: 'var(--sp-2) var(--sp-3)', background: 'var(--background)', borderRadius: 'var(--radius-sm)' }}>
          <strong>Tài khoản:</strong> {selectedUser?.fullName} ({selectedUser?.email})
        </div>

        <Form layout="vertical">
          <Form.Item label="Chọn vai trò mới:">
            <Select
              value={newRole}
              onChange={setNewRole}
              options={[
                { label: 'Bạn đọc (Reader) - Mượn trả và tra cứu sách', value: 'Reader' },
                { label: 'Thủ thư (Librarian) - Quản lý lưu thông & nhập sách', value: 'Librarian' },
                { label: 'Quản trị viên (Admin) - Toàn quyền cấu hình hệ thống', value: 'Admin' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
