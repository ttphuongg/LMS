import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Tag,
  Badge,
  Space,
  Progress,
  Drawer,
  Card,
  Row,
  Col,
  Select,
  Statistic,
  Descriptions,
  Alert,
} from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  StopOutlined,
  InboxOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { PageHeader } from '@/shared/components/PageHeader'
import { SpineTag } from '@/shared/components/SpineTag'
import { getErrorMessage } from '@/shared/utils/format'
import {
  primaryButtonStyle,
  outlineButtonStyle,
  radiusStyle,
  modalTitleStyle,
  mutedTextStyle,
  mutedText13Style,
  cardStyle,
} from '@/shared/styles/ui'
import { catalogApi } from '../api'
import type { LocationDto, AddLocationRequest, UpdateLocationRequest } from '../types'

export const AdminLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<LocationDto[]>([])
  const [loading, setLoading] = useState(false)

  // Bộ lọc tìm kiếm
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Modal Thêm mới
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addForm] = Form.useForm<AddLocationRequest>()

  // Modal Chỉnh sửa
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationDto | null>(null)
  const [editForm] = Form.useForm<UpdateLocationRequest>()

  // Drawer Xem chi tiết
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailedLocation, setDetailedLocation] = useState<LocationDto | null>(null)

  // Tải danh sách tất cả vị trí (activeOnly = false để lấy cả đang dùng và tạm khóa)
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await catalogApi.getLocations(false)
      setLocations(data)
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi tải danh sách vị trí kệ sách'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  // Lọc dữ liệu theo từ khóa và trạng thái
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      // Lọc trạng thái
      if (statusFilter === 'ACTIVE' && !loc.isActive) return false
      if (statusFilter === 'INACTIVE' && loc.isActive) return false

      // Lọc từ khóa
      if (!keyword.trim()) return true
      const q = keyword.trim().toLowerCase()
      const matchAisle = loc.aisle?.toLowerCase().includes(q)
      const matchShelf = loc.shelf?.toLowerCase().includes(q)
      const matchRow = String(loc.rowLevel).includes(q)
      const matchId = String(loc.id).includes(q)
      return matchAisle || matchShelf || matchRow || matchId
    })
  }, [locations, keyword, statusFilter])

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = locations.length
    const active = locations.filter((l) => l.isActive).length
    const inactive = total - active
    const totalStored = locations.reduce((sum, l) => sum + (l.currentCount || 0), 0)
    const totalCapacity = locations.reduce((sum, l) => sum + (l.maxCapacity || 0), 0)
    return { total, active, inactive, totalStored, totalCapacity }
  }, [locations])

  // Mở modal thêm mới
  const handleOpenAdd = () => {
    addForm.resetFields()
    addForm.setFieldsValue({ rowLevel: 1 })
    setAddModalOpen(true)
  }

  // Submit thêm mới
  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields()
      setAdding(true)
      await catalogApi.createLocation({
        aisle: values.aisle.trim(),
        shelf: values.shelf.trim(),
        rowLevel: Number(values.rowLevel),
        maxCapacity: values.maxCapacity ? Number(values.maxCapacity) : undefined,
      })
      message.success('Đã tạo vị trí kệ sách mới thành công!')
      setAddModalOpen(false)
      addForm.resetFields()
      fetchLocations()
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return
      message.error(getErrorMessage(err, 'Lỗi khi tạo vị trí kệ sách'))
    } finally {
      setAdding(false)
    }
  }

  // Mở modal chỉnh sửa
  const handleOpenEdit = (loc: LocationDto) => {
    setSelectedLocation(loc)
    editForm.resetFields()
    editForm.setFieldsValue({
      aisle: loc.aisle,
      shelf: loc.shelf,
      rowLevel: loc.rowLevel,
      maxCapacity: loc.maxCapacity,
      isActive: loc.isActive,
    })
    setEditModalOpen(true)
  }

  // Submit chỉnh sửa
  const handleEditSubmit = async () => {
    if (!selectedLocation) return
    try {
      const values = await editForm.validateFields()
      setEditing(true)
      await catalogApi.updateLocation(selectedLocation.id, {
        locationId: selectedLocation.id,
        aisle: values.aisle.trim(),
        shelf: values.shelf.trim(),
        rowLevel: Number(values.rowLevel),
        maxCapacity: values.maxCapacity ? Number(values.maxCapacity) : undefined,
        isActive: Boolean(values.isActive),
      })
      message.success('Cập nhật vị trí kệ sách thành công!')
      setEditModalOpen(false)
      fetchLocations()
      // Nếu đang mở drawer chi tiết của vị trí này, cập nhật lại
      if (detailedLocation?.id === selectedLocation.id) {
        handleOpenDetail(selectedLocation.id)
      }
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown })?.errorFields) return
      message.error(getErrorMessage(err, 'Lỗi khi cập nhật vị trí kệ sách'))
    } finally {
      setEditing(false)
    }
  }

  // Mở Drawer chi tiết
  const handleOpenDetail = async (id: number) => {
    try {
      setDetailLoading(true)
      setDetailDrawerOpen(true)
      const data = await catalogApi.getLocationById(id)
      setDetailedLocation(data)
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Lỗi khi tải chi tiết vị trí'))
    } finally {
      setDetailLoading(false)
    }
  }

  // Các cột bảng
  const columns: ColumnsType<LocationDto> = [
    {
      title: 'Mã',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <SpineTag variant="neutral">#{id}</SpineTag>,
    },
    {
      title: 'Dãy kệ (Aisle)',
      dataIndex: 'aisle',
      key: 'aisle',
      width: 140,
      render: (aisle: string) => <strong>{aisle}</strong>,
    },
    {
      title: 'Kệ (Shelf)',
      dataIndex: 'shelf',
      key: 'shelf',
      width: 120,
    },
    {
      title: 'Tầng / Hàng',
      dataIndex: 'rowLevel',
      key: 'rowLevel',
      width: 110,
      render: (row: number) => `Tầng ${row}`,
    },
    {
      title: 'Tọa độ vị trí',
      key: 'coordinates',
      render: (_, record) => (
        <Space size="small">
          <Tag
            color="default"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--card)',
              borderColor: 'var(--border)',
            }}
          >
            {record.aisle} · {record.shelf} · T{record.rowLevel}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Sức chứa & Lấp đầy',
      key: 'capacity',
      width: 190,
      render: (_, record) => {
        const count = record.currentCount ?? 0
        const max = record.maxCapacity
        const percent = max && max > 0 ? Math.min(100, Math.round((count / max) * 100)) : null
        const strokeColor =
          percent === null
            ? undefined
            : percent >= 100
            ? 'var(--destructive)'
            : percent >= 80
            ? 'var(--warning)'
            : 'var(--primary)'

        return (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>
                <strong>{count}</strong> cuốn
              </span>
              <span style={mutedTextStyle}>{max ? `Tối đa ${max}` : 'Không giới hạn'}</span>
            </div>
            {max && max > 0 && (
              <Progress
                percent={percent ?? undefined}
                size="small"
                strokeColor={strokeColor}
                showInfo={false}
                style={{ margin: '3px 0 0 0' }}
              />
            )}
          </div>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 140,
      render: (isActive: boolean) =>
        isActive ? (
          <Badge
            status="success"
            text={<span style={{ color: 'var(--primary)', fontWeight: 500 }}>Đang sử dụng</span>}
          />
        ) : (
          <Badge status="default" text={<span style={mutedTextStyle}>Tạm khóa</span>} />
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 170,
      render: (_, record) => (
        <Space orientation="horizontal" size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDetail(record.id)}
            style={outlineButtonStyle}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
            style={outlineButtonStyle}
          >
            Sửa
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Quản Lý Vị Trí Kệ Sách"
        subtitle="Khai báo dãy kệ, ngăn kệ và giới hạn sức chứa tài liệu trong kho lưu trữ"
        breadcrumbs={[
          { title: 'Quản trị', href: '/admin/dashboard' },
          { title: 'Vị trí kệ sách' },
        ]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAdd}
            style={primaryButtonStyle}
          >
            Thêm vị trí mới
          </Button>
        }
      />

      {/* Thẻ thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: 'var(--sp-4)' }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={cardStyle}>
            <Statistic
              title={<span style={mutedText13Style}>Tổng số vị trí</span>}
              value={stats.total}
              prefix={<AppstoreOutlined style={{ color: 'var(--primary)' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={cardStyle}>
            <Statistic
              title={<span style={mutedText13Style}>Đang sử dụng</span>}
              value={stats.active}
              styles={{ content: { color: 'var(--primary)' } }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={cardStyle}>
            <Statistic
              title={<span style={mutedText13Style}>Tạm khóa</span>}
              value={stats.inactive}
              styles={{ content: { color: 'var(--muted-foreground)' } }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={cardStyle}>
            <Statistic
              title={<span style={mutedText13Style}>Sách đang lưu trên kệ</span>}
              value={stats.totalStored}
              suffix={stats.totalCapacity > 0 ? `/ ${stats.totalCapacity}` : 'cuốn'}
              prefix={<BookOutlined style={{ color: 'var(--accent)' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Thanh tìm kiếm & lọc */}
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
            placeholder="Tìm theo dãy, kệ, tầng hoặc mã..."
            prefix={<SearchOutlined style={mutedTextStyle} />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 280, borderRadius: 'var(--radius)' }}
            allowClear
          />

          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            style={{ width: 170 }}
            options={[
              { label: 'Tất cả trạng thái', value: 'ALL' },
              { label: 'Đang sử dụng', value: 'ACTIVE' },
              { label: 'Tạm khóa', value: 'INACTIVE' },
            ]}
          />

          <Button icon={<ReloadOutlined />} onClick={fetchLocations} loading={loading}>
            Làm mới
          </Button>
        </Space>

        <span style={mutedText13Style}>
          Hiển thị: <strong>{filteredLocations.length}</strong> / {locations.length} vị trí
        </span>
      </div>

      {/* Bảng danh sách */}
      <Table
        columns={columns}
        dataSource={filteredLocations}
        rowKey="id"
        loading={loading}
        bordered
        scroll={{ x: 800 }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Tổng cộng ${total} vị trí`,
        }}
      />

      {/* Modal Thêm mới vị trí */}
      <Modal
        title={<span style={modalTitleStyle}>Thêm Vị Trí Kệ Sách Mới</span>}
        open={addModalOpen}
        onOk={handleAddSubmit}
        confirmLoading={adding}
        onCancel={() => setAddModalOpen(false)}
        okText="Lưu vị trí"
        cancelText="Hủy"
        okButtonProps={{ style: primaryButtonStyle }}
        cancelButtonProps={{ style: radiusStyle }}
      >
        <Form form={addForm} layout="vertical" style={{ marginTop: 'var(--sp-3)' }}>
          <Form.Item
            label="Dãy kệ (Aisle)"
            name="aisle"
            rules={[
              { required: true, message: 'Vui lòng nhập tên dãy kệ' },
              { max: 50, message: 'Dãy kệ tối đa 50 ký tự' },
            ]}
          >
            <Input placeholder="VD: Dãy A, Khu Văn Học, K01..." />
          </Form.Item>

          <Form.Item
            label="Kệ / Ngăn (Shelf)"
            name="shelf"
            rules={[
              { required: true, message: 'Vui lòng nhập tên/số kệ' },
              { max: 50, message: 'Kệ tối đa 50 ký tự' },
            ]}
          >
            <Input placeholder="VD: Kệ 01, S1, Hàng B..." />
          </Form.Item>

          <Form.Item
            label="Tầng / Hàng (Row Level)"
            name="rowLevel"
            rules={[
              { required: true, message: 'Vui lòng nhập tầng/hàng' },
              { type: 'number', min: 1, message: 'Tầng phải là số nguyên lớn hơn 0' },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="VD: 1, 2, 3..." />
          </Form.Item>

          <Form.Item
            label="Sức chứa tối đa (cuốn sách)"
            name="maxCapacity"
            rules={[
              {
                type: 'number',
                min: 1,
                message: 'Sức chứa tối đa phải lớn hơn 0 nếu có nhập',
              },
            ]}
            extra="Để trống nếu kệ không giới hạn sức chứa."
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="VD: 50 (cuốn sách)"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Chỉnh sửa vị trí */}
      <Modal
        title={
          <span style={modalTitleStyle}>
            Chỉnh Sửa Vị Trí Kệ Sách #{selectedLocation?.id}
          </span>
        }
        open={editModalOpen}
        onOk={handleEditSubmit}
        confirmLoading={editing}
        onCancel={() => setEditModalOpen(false)}
        okText="Cập nhật vị trí"
        cancelText="Hủy"
        okButtonProps={{ style: primaryButtonStyle }}
        cancelButtonProps={{ style: radiusStyle }}
      >
        {selectedLocation && (
          <>
            {selectedLocation.currentCount !== undefined && selectedLocation.currentCount > 0 && (
              <Alert
                type="info"
                showIcon
                icon={<InboxOutlined />}
                title={`Hiện đang có ${selectedLocation.currentCount} cuốn sách lưu trữ tại kệ này.`}
                description="Sức chứa tối đa không được nhỏ hơn số sách hiện có. Nếu tạm khóa, các bản sao cũ vẫn được giữ nhưng không thể xếp thêm bản sao mới."
                style={{ marginBottom: 'var(--sp-3)' }}
              />
            )}

            <Form form={editForm} layout="vertical">
              <Form.Item
                label="Dãy kệ (Aisle)"
                name="aisle"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên dãy kệ' },
                  { max: 50, message: 'Dãy kệ tối đa 50 ký tự' },
                ]}
              >
                <Input placeholder="VD: Dãy A" />
              </Form.Item>

              <Form.Item
                label="Kệ / Ngăn (Shelf)"
                name="shelf"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên/số kệ' },
                  { max: 50, message: 'Kệ tối đa 50 ký tự' },
                ]}
              >
                <Input placeholder="VD: Kệ 01" />
              </Form.Item>

              <Form.Item
                label="Tầng / Hàng (Row Level)"
                name="rowLevel"
                rules={[
                  { required: true, message: 'Vui lòng nhập tầng/hàng' },
                  { type: 'number', min: 1, message: 'Tầng phải lớn hơn 0' },
                ]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Sức chứa tối đa (cuốn sách)"
                name="maxCapacity"
                rules={[
                  {
                    type: 'number',
                    min: 1,
                    message: 'Sức chứa tối đa phải lớn hơn 0 nếu nhập',
                  },
                  () => ({
                    validator(_, value) {
                      if (
                        value &&
                        selectedLocation?.currentCount &&
                        value < selectedLocation.currentCount
                      ) {
                        return Promise.reject(
                          new Error(
                            `Sức chứa tối đa không thể nhỏ hơn số sách đang lưu (${selectedLocation.currentCount} cuốn)`
                          )
                        )
                      }
                      return Promise.resolve()
                    },
                  }),
                ]}
                extra="Để trống nếu không giới hạn sức chứa."
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Để trống nếu không giới hạn" />
              </Form.Item>

              <Form.Item
                label="Trạng thái kích hoạt"
                name="isActive"
                valuePropName="checked"
                extra="Tạm khóa vị trí nếu kệ đang bảo trì hoặc ngừng sử dụng."
              >
                <Switch
                  checkedChildren="Đang sử dụng"
                  unCheckedChildren="Tạm khóa"
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Drawer Xem chi tiết vị trí */}
      <Drawer
        title={
          <span style={modalTitleStyle}>
            Chi Tiết Vị Trí #{detailedLocation?.id}
          </span>
        }
        placement="right"
        size={Math.min(480, typeof window !== 'undefined' ? window.innerWidth - 30 : 480)}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        extra={
          detailedLocation && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setDetailDrawerOpen(false)
                handleOpenEdit(detailedLocation)
              }}
              style={primaryButtonStyle}
            >
              Chỉnh sửa
            </Button>
          )
        }
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>Đang tải...</div>
        ) : detailedLocation ? (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Mã vị trí">
                <SpineTag variant="neutral">#{detailedLocation.id}</SpineTag>
              </Descriptions.Item>
              <Descriptions.Item label="Dãy kệ (Aisle)">
                <strong>{detailedLocation.aisle}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Kệ (Shelf)">
                {detailedLocation.shelf}
              </Descriptions.Item>
              <Descriptions.Item label="Tầng / Hàng (Row Level)">
                Tầng {detailedLocation.rowLevel}
              </Descriptions.Item>
              <Descriptions.Item label="Tọa độ hiển thị">
                <Tag color="blue" style={{ fontFamily: 'var(--font-mono)' }}>
                  {detailedLocation.aisle}-{detailedLocation.shelf}-T{detailedLocation.rowLevel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái hoạt động">
                {detailedLocation.isActive ? (
                  <Badge status="success" text="Đang sử dụng" />
                ) : (
                  <Badge status="default" text="Tạm khóa" />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Số sách đang lưu">
                <strong>{detailedLocation.currentCount ?? 0}</strong> cuốn
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa tối đa">
                {detailedLocation.maxCapacity
                  ? `${detailedLocation.maxCapacity} cuốn`
                  : 'Không giới hạn'}
              </Descriptions.Item>
            </Descriptions>

            {detailedLocation.maxCapacity && detailedLocation.maxCapacity > 0 && (
              <div
                style={{
                  marginTop: 'var(--sp-4)',
                  padding: 'var(--sp-3)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <div style={{ marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
                  Tỷ lệ lấp đầy kệ:
                </div>
                {(() => {
                  const count = detailedLocation.currentCount ?? 0
                  const max = detailedLocation.maxCapacity ?? 1
                  const pct = Math.min(100, Math.round((count / max) * 100))
                  const strokeColor =
                    pct >= 100 ? 'var(--destructive)' : pct >= 80 ? 'var(--warning)' : 'var(--primary)'
                  return (
                    <div>
                      <Progress percent={pct} strokeColor={strokeColor} />
                      <div
                        style={{
                          marginTop: 'var(--sp-1)',
                          fontSize: 12,
                          color: 'var(--muted-foreground)',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Còn trống: {Math.max(0, max - count)} cuốn</span>
                        <span>{pct >= 100 ? 'Kệ đã đầy' : pct >= 80 ? 'Sắp đầy' : 'Còn nhiều chỗ'}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
