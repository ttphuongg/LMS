import React from 'react'
import { Modal, Button, Typography, Tag, Divider } from 'antd'
import { ReadOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

interface LibraryPolicyModalProps {
  open: boolean
  onClose: () => void
  onAgree: () => void
}

export const LibraryPolicyModal: React.FC<LibraryPolicyModalProps> = ({
  open,
  onClose,
  onAgree,
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}>
          <ReadOutlined style={{ color: 'var(--primary)', fontSize: 20 }} />
          <span>Quy định & Điều khoản Sử dụng Thư viện Domus Libri</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={760}
      centered
      footer={[
        <Button key="close" onClick={onClose} style={{ borderRadius: 'var(--radius)' }}>
          Đóng
        </Button>,
        <Button
          key="agree"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={onAgree}
          style={{
            background: 'var(--primary)',
            borderColor: 'var(--primary)',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
          }}
        >
          Tôi đã đọc và Đồng ý
        </Button>,
      ]}
    >
      <div
        style={{
          maxHeight: 520,
          overflowY: 'auto',
          paddingRight: 12,
          fontSize: 13.5,
          lineHeight: 1.65,
          color: 'var(--text-main, #262626)',
        }}
      >
        <div
          style={{
            background: 'rgba(31, 58, 46, 0.05)',
            border: '1px solid rgba(31, 58, 46, 0.15)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <SafetyCertificateOutlined style={{ color: 'var(--primary)', fontSize: 22 }} />
          <div>
            <Text strong style={{ color: 'var(--primary)' }}>
              Thư viện Domus Libri (Website: https://libri.id.vn)
            </Text>
            <div style={{ fontSize: 12.5, color: '#595959' }}>
              Vui lòng đọc kỹ các quy định dưới đây trước khi đăng ký và sử dụng dịch vụ của Thư viện.
            </div>
          </div>
        </div>

        {/* CHƯƠNG I */}
        <Title level={5} style={{ color: 'var(--primary)', marginTop: 12, marginBottom: 8 }}>
          CHƯƠNG I. PHẠM VI VÀ TÀI KHOẢN
        </Title>
        <Paragraph>
          <Text strong>Điều 1. Phạm vi áp dụng:</Text> Quy định này áp dụng cho người sử dụng dịch vụ của Domus Libri qua website và tại quầy thủ thư; bao gồm đăng ký tài khoản, tra cứu, mượn, trả, gia hạn, đặt trước, phí phạt và xử lý thông tin cá nhân. Người dùng cần đọc và tích chọn đồng ý quy định trước khi hoàn tất đăng ký.
        </Paragraph>
        <Paragraph>
          <Text strong>Điều 2. Đăng ký và xác thực:</Text> Bất kỳ cá nhân nào có địa chỉ email hợp lệ đều có thể đăng ký; mỗi người chỉ được sở hữu một tài khoản. Đăng ký phải xác thực email bằng mã OTP 6 chữ số. Người dùng chịu trách nhiệm cung cấp thông tin trung thực, bảo quản mật khẩu và thông báo ngay cho thư viện khi nghi ngờ tài khoản bị lộ.
        </Paragraph>
        <Paragraph>
          <Text strong>Điều 3. Tạm khóa tài khoản:</Text> Thư viện có quyền nhắc nhở, tạm khóa hoặc khóa tài khoản tùy mức độ vi phạm (quá hạn kéo dài, chưa hoàn tất nghĩa vụ phí phạt, hoặc có dấu hiệu gian lận). Tài khoản bị khóa sẽ không thể đăng nhập cho đến khi xử lý xong nghĩa vụ tại quầy thủ thư.
        </Paragraph>

        <Divider style={{ margin: '14px 0' }} />

        {/* CHƯƠNG II */}
        <Title level={5} style={{ color: 'var(--primary)', marginTop: 0, marginBottom: 8 }}>
          CHƯƠNG II. MƯỢN, TRẢ, GIA HẠN VÀ ĐẶT TRƯỚC
        </Title>
        <Paragraph>
          <Text strong>Điều 4. Điều kiện và thời hạn mượn:</Text>
          <ul>
            <li>Mỗi tài khoản được mượn tối đa <Tag color="blue">05 cuốn</Tag> tại cùng một thời điểm.</li>
            <li>Thời hạn mượn tối đa là <Tag color="blue">14 ngày</Tag> tính theo hạn trả hệ thống ghi nhận.</li>
            <li>Độc giả đang có phí phạt chưa thanh toán sẽ không được thực hiện lượt mượn mới. Việc trả sách thực hiện trực tiếp tại quầy thủ thư.</li>
          </ul>
        </Paragraph>
        <Paragraph>
          <Text strong>Điều 5. Gia hạn sách:</Text>
          <ul>
            <li>Mỗi lượt mượn được gia hạn tối đa <Tag color="cyan">03 lần</Tag>, mỗi lần thêm <Tag color="cyan">07 ngày</Tag>.</li>
            <li>Chỉ chấp nhận gia hạn khi sách chưa bị quá hạn và không có người khác đang chờ đặt trước cuốn sách đó.</li>
          </ul>
        </Paragraph>
        <Paragraph>
          <Text strong>Điều 6. Đặt trước sách:</Text>
          <ul>
            <li>Chỉ cho phép đặt trước khi tất cả các bản sao của đầu sách đang được mượn hết.</li>
            <li>Khi sách sẵn sàng tại quầy, thư viện gửi thông báo đến độc giả. Thời hạn giữ sách để đến nhận là <Tag color="orange">48 giờ</Tag>. Sau 48 giờ không đến nhận, yêu cầu đặt trước sẽ tự động hết hiệu lực.</li>
          </ul>
        </Paragraph>

        <Divider style={{ margin: '14px 0' }} />

        {/* CHƯƠNG III */}
        <Title level={5} style={{ color: 'var(--primary)', marginTop: 0, marginBottom: 8 }}>
          CHƯƠNG III. PHÍ PHẠT VÀ BỒI THƯỜNG
        </Title>
        <Paragraph>
          <Text strong>Điều 7. Phạt trả chậm (Quá hạn):</Text>
          <ul>
            <li>Mỗi cuốn sách quá hạn chịu phí phạt <Tag color="volcano">5.000 VNĐ / ngày</Tag> quá hạn.</li>
            <li>Ngày quá hạn tính từ 00:00 của ngày kế tiếp sau ngày hết hạn.</li>
            <li>Tổng phí trả chậm trên mỗi cuốn tối đa bằng <Tag color="red">150% giá trị cuốn sách</Tag>. Khi đạt trần này, tiền phạt quá hạn sẽ không tăng thêm.</li>
            <li>Quá hạn từ 03 ngày trở lên, hệ thống sẽ tạm ngừng quyền mượn sách mới cho đến khi hoàn tất trả sách và nộp phạt.</li>
          </ul>
        </Paragraph>
        <Paragraph>
          <Text strong>Điều 8. Sách bị mất hoặc hư hỏng:</Text>
          <ul>
            <li><Text strong>Làm mất sách:</Text> Bồi thường <Tag color="red">150% giá trị sách</Tag>. Khi xác nhận mất sách, hệ thống không cộng dồn thêm phí quá hạn phát sinh sau đó.</li>
            <li><Text strong>Hư hỏng nhẹ</Text> (xước bìa, gập góc, vết bẩn nhỏ có thể phục hồi): Bồi thường <Tag color="orange">30% giá trị sách</Tag>.</li>
            <li><Text strong>Hư hỏng nặng</Text> (mất trang, rách chữ/hình, ngấm nước mốc biến dạng, hỏng gáy nặng): Bồi thường <Tag color="red">100% giá trị sách</Tag>.</li>
            <li>Thủ thư sẽ lập biên bản sự cố, đánh giá hiện trạng và ghi nhận kết xuất biên lai bồi hoàn.</li>
          </ul>
        </Paragraph>
        <Paragraph>
          <Text strong>Điều 9. Thanh toán:</Text> Các khoản phí phạt và bồi thường được thanh toán bằng tiền mặt hoặc phương thức được hỗ trợ tại quầy thủ thư. Độc giả phải hoàn tất thanh toán nợ phạt trước khi tiếp tục mượn sách.
        </Paragraph>

        <Divider style={{ margin: '14px 0' }} />

        {/* CHƯƠNG IV */}
        <Title level={5} style={{ color: 'var(--primary)', marginTop: 0, marginBottom: 8 }}>
          CHƯƠNG IV. BẢO MẬT VÀ QUYỀN RIÊNG TƯ
        </Title>
        <Paragraph>
          <Text strong>Điều 10. Thu thập và mục đích xử lý dữ liệu:</Text> Hệ thống chỉ thu thập họ tên, email, số điện thoại phục vụ việc xác thực tài khoản, nhắc hạn mượn trả, thông báo sự cố và quản lý vận hành lưu thông sách.
        </Paragraph>
        <Paragraph>
          <Text strong>Điều 11. Bảo vệ dữ liệu:</Text> Domus Libri cam kết không mua bán, trao đổi thông tin cá nhân của độc giả cho bên thứ ba. Lịch sử mượn trả chỉ được truy cập bởi chính độc giả, thủ thư và quản trị viên phục vụ mục đích quản lý.
        </Paragraph>
        <Paragraph>
          <Text strong>Điều 12. Quyền của người dùng:</Text> Người dùng có quyền xem và cập nhật thông tin cá nhân. Để đảm bảo tính toàn vẹn lịch sử mượn trả và tài sản công, hệ thống không cho phép tự ý xóa tài khoản khi đang có giao dịch phát sinh.
        </Paragraph>

        <Divider style={{ margin: '14px 0' }} />

        {/* CHƯƠNG V */}
        <Title level={5} style={{ color: 'var(--primary)', marginTop: 0, marginBottom: 8 }}>
          CHƯƠNG V. TRÁCH NHIỆM, KHIẾU NẠI VÀ HIỆU LỰC
        </Title>
        <Paragraph>
          <Text strong>Điều 13. Trách nhiệm người dùng:</Text> Độc giả có nghĩa vụ giữ gìn, bảo quản sách cẩn thận, trả sách đúng hạn và tuân thủ các hướng dẫn của thủ thư tại không gian thư viện.
        </Paragraph>
        <Paragraph>
          <Text strong>Điều 14. Khiếu nại và hỗ trợ:</Text> Độc giả có quyền khiếu nại về các khoản phạt hoặc sự cố trực tiếp tại quầy thủ thư hoặc qua email hỗ trợ chính thức. Thư viện cam kết xem xét và phản hồi trong vòng 07 ngày làm việc.
        </Paragraph>
        <Paragraph>
          <Text strong>Điều 15. Hiệu lực:</Text> Quy định có hiệu lực kể từ ngày công bố chính thức trên website Thư viện Domus Libri. Khi đăng ký tài khoản, độc giả xác nhận đã hiểu rõ và tự nguyện tuân thủ toàn bộ các điều khoản nêu trên.
        </Paragraph>
      </div>
    </Modal>
  )
}

