import React, { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, Card, Alert, Typography, Checkbox } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { identityApi } from '../api'
import { useAuth } from '../authStore'
import { LibraryPolicyModal } from '../components/LibraryPolicyModal'
import type { RegisterRequest } from '../types'
import type { CurrentUser, UserRole } from '@/shared/api/types'
import { mutedTextStyle, radiusStyle } from '@/shared/styles/ui'
import { getErrorMessage } from '@/shared/utils/format'

const { Title, Text } = Typography

/** Hàm ẩn bớt ký tự email để bảo mật thông tin (vd: ngu***@gmail.com) */
const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email
  const [localPart, domain] = email.split('@')
  if (localPart.length <= 2) {
    return `${localPart}***@${domain}`
  }
  const visible = localPart.slice(0, 3)
  return `${visible}***@${domain}`
}

/** Định dạng giây thành mm:ss */
const formatTimer = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface RegistrationSession {
  token?: string
  values: {
    username?: string
    fullName?: string
    email?: string
    phone?: string
    password?: string
  }
  registeredEmail: string
  otpExpiresAt: number
  cooldownEndsAt: number
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [form] = Form.useForm()

  // Quản lý bước: 'form' (điền thông tin) | 'verify-otp' (nhập mã xác thực email)
  const [step, setStep] = useState<'form' | 'verify-otp'>('form')

  // Trạng thái đồng ý quy định thư viện & mở modal xem quy định
  const [agreePolicy, setAgreePolicy] = useState(false)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)

  // Trạng thái phiên đăng ký đang chờ xác thực (lưu lại thông tin để kiểm tra thay đổi & sở hữu phiên)
  const [registrationSession, setRegistrationSession] = useState<RegistrationSession | null>(null)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)

  // Trạng thái kiểm tra tương tác từng trường (On Blur + On Change validation)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Trạng thái xử lý form đăng ký
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Trạng thái xác thực OTP
  const [registeredEmail, setRegisteredEmail] = useState<string>('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  // Bộ đếm thời gian: hiệu lực OTP (180s = 3 phút), gửi lại OTP (60s)
  const [otpTimeLeft, setOtpTimeLeft] = useState<number>(180)
  const [resendCooldown, setResendCooldown] = useState<number>(60)
  const [resending, setResending] = useState(false)

  // Tham chiếu các ô nhập OTP để tự động chuyển focus
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Đánh dấu trường đã tương tác khi rời khỏi ô nhập (onBlur)
  const markTouched = (fieldName: string) => {
    if (!touched[fieldName]) {
      setTouched((prev) => ({ ...prev, [fieldName]: true }))
    }
  }

  // Đếm ngược thời gian khi ở màn hình nhập OTP
  useEffect(() => {
    if (step !== 'verify-otp') return

    const interval = setInterval(() => {
      setOtpTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [step])

  // Tự động focus vào ô OTP đầu tiên khi chuyển sang bước xác thực
  useEffect(() => {
    if (step === 'verify-otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus()
      }, 150)
    }
  }, [step])

  // ── Xử lý gửi Form Đăng Ký ────────────────────────────────────────────────
  const handleRegisterSubmit = async (values: RegisterRequest) => {
    if (!agreePolicy) {
      message.warning('Vui lòng đọc và đồng ý với quy định của thư viện để tiếp tục.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Kiểm tra nếu thông tin form không thay đổi so với phiên đăng ký đang chờ
      const isUnchanged =
        registrationSession &&
        values.username?.trim().toLowerCase() === registrationSession.values.username?.trim().toLowerCase() &&
        values.email?.trim().toLowerCase() === registrationSession.values.email?.trim().toLowerCase() &&
        values.fullName?.trim() === registrationSession.values.fullName?.trim() &&
        (values.phone?.trim() || values.phoneNumber?.trim() || '') === (registrationSession.values.phone?.trim() || '') &&
        values.password === registrationSession.values.password

      if (isUnchanged) {
        // Tiếp tục phiên xác thực OTP đang chờ thay vì tạo tài khoản mới hay gửi lại request
        setStep('verify-otp')
        const now = Date.now()
        const remainingOtp = Math.max(0, Math.floor((registrationSession.otpExpiresAt - now) / 1000))
        const remainingCooldown = Math.max(0, Math.floor((registrationSession.cooldownEndsAt - now) / 1000))
        setOtpTimeLeft(remainingOtp)
        setResendCooldown(remainingCooldown)

        if (remainingOtp === 0) {
          setOtpError('Mã OTP hiện tại đã hết hạn. Vui lòng bấm "Gửi lại mã" để nhận mã mới.')
        } else {
          message.info('Tiếp tục phiên xác thực email của bạn.')
        }
        return
      }

      // Có thay đổi thông tin hoặc đăng ký mới lần đầu:
      // Gửi yêu cầu đăng ký lên backend kèm registrationToken (nếu có để xác thực quyền sở hữu phiên)
      const res = await identityApi.register({
        ...values,
        registrationToken: registrationSession?.token,
      })

      const now = Date.now()
      const newSession: RegistrationSession = {
        token: res.registrationToken,
        values: {
          username: values.username,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone || values.phoneNumber,
          password: values.password,
        },
        registeredEmail: res.email || values.email.trim(),
        otpExpiresAt: now + 180 * 1000,
        cooldownEndsAt: now + 60 * 1000,
      }

      setRegistrationSession(newSession)
      setRegisteredEmail(newSession.registeredEmail)
      setStep('verify-otp')
      setOtpDigits(['', '', '', '', '', ''])
      setOtpError(null)
      setOtpTimeLeft(180) // 3 phút
      setResendCooldown(60) // 60 giây

      if (res.emailSent === false) {
        setEmailWarning(res.emailError || 'Máy chủ chưa gửi được email OTP. Vui lòng bấm "Gửi lại mã" hoặc kiểm tra cấu hình SMTP.')
        message.warning(res.message || 'Khởi tạo tài khoản thành công nhưng gửi email OTP gặp sự cố.')
      } else {
        setEmailWarning(null)
        message.success(res.message || 'Mã xác thực OTP đã được gửi đến email của bạn.')
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Đăng ký không thành công. Vui lòng thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  // Khi bấm Đăng ký mà form còn lỗi → đánh dấu tất cả các trường đã chạm để hiển thị lỗi
  const handleRegisterFailed = () => {
    setTouched({
      username: true,
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    })
  }

  // ── Xử lý nhập các ô OTP ──────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Lọc chỉ giữ các ký tự số
    const cleanDigits = value.replace(/\D/g, '')

    if (!cleanDigits) {
      const newDigits = [...otpDigits]
      newDigits[index] = ''
      setOtpDigits(newDigits)
      return
    }

    const newDigits = [...otpDigits]

    // Nếu người dùng dán hoặc bộ gõ tiếng Việt (Telex/Unikey) đẩy nhiều số cùng lúc:
    // Tự động phân phối lần lượt vào các ô tiếp theo
    let lastFilledIndex = index
    for (let i = 0; i < cleanDigits.length && index + i < 6; i++) {
      newDigits[index + i] = cleanDigits[i]
      lastFilledIndex = index + i
    }

    setOtpDigits(newDigits)
    setOtpError(null)

    // Dùng setTimeout nhỏ để giải phóng hàng đợi IME của Unikey/Telex trước khi chuyển focus
    if (lastFilledIndex < 5) {
      setTimeout(() => {
        otpInputRefs.current[lastFilledIndex + 1]?.focus()
      }, 15)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Nếu ô hiện tại rỗng, focus về ô trước và xóa
        const newDigits = [...otpDigits]
        newDigits[index - 1] = ''
        setOtpDigits(newDigits)
        otpInputRefs.current[index - 1]?.focus()
      } else if (otpDigits[index]) {
        const newDigits = [...otpDigits]
        newDigits[index] = ''
        setOtpDigits(newDigits)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    } else if (e.key === 'Enter') {
      const fullOtp = otpDigits.join('')
      if (fullOtp.length === 6 && !verifying) {
        handleVerifyOtp()
      }
    }
  }

  // Hỗ trợ dán (Paste) toàn bộ chuỗi OTP 6 số
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const newDigits = ['', '', '', '', '', '']
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i]
    }
    setOtpDigits(newDigits)
    setOtpError(null)

    const nextIndex = Math.min(pastedData.length, 5)
    otpInputRefs.current[nextIndex]?.focus()
  }

  // ── Xử lý xác minh OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const fullOtp = otpDigits.join('')
    if (fullOtp.length < 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã xác thực.')
      return
    }

    if (otpTimeLeft === 0) {
      setOtpError('Mã xác thực đã hết hạn. Vui lòng bấm "Gửi lại mã" để nhận mã mới.')
      return
    }

    try {
      setVerifying(true)
      setOtpError(null)

      const authData = await identityApi.verifyEmailOtp({
        email: registeredEmail,
        otp: fullOtp,
      })

      if (authData && authData.accessToken) {
        const user: CurrentUser = {
          id: authData.accountId,
          username: authData.username,
          fullName: authData.fullName,
          email: authData.email,
          role: authData.role as UserRole,
        }
        setAuth(user, authData.accessToken, authData.refreshToken)
        setRegistrationSession(null)
        message.success(`Xác thực thành công! Chào mừng ${authData.fullName || authData.username} đến với Thư viện.`)
        navigate('/', { replace: true })
      } else {
        setRegistrationSession(null)
        message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.')
        navigate('/login', { replace: true })
      }
    } catch (err: unknown) {
      setOtpError(getErrorMessage(err, 'Mã xác thực không chính xác hoặc đã hết hạn.'))
    } finally {
      setVerifying(false)
    }
  }

  // ── Xử lý gửi lại mã OTP ─────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return

    try {
      setResending(true)
      setOtpError(null)

      await identityApi.resendEmailOtp({ email: registeredEmail })

      setEmailWarning(null)
      message.success('Mã xác thực mới đã được gửi đến email của bạn.')
      setOtpDigits(['', '', '', '', '', ''])
      const now = Date.now()
      setOtpTimeLeft(180) // Reset 3 phút
      setResendCooldown(60) // Reset cooldown 60 giây

      if (registrationSession) {
        setRegistrationSession({
          ...registrationSession,
          otpExpiresAt: now + 180 * 1000,
          cooldownEndsAt: now + 60 * 1000,
        })
      }

      otpInputRefs.current[0]?.focus()
    } catch (err: unknown) {
      setOtpError(getErrorMessage(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.'))
    } finally {
      setResending(false)
    }
  }

  // ── Quay lại chỉnh sửa thông tin đăng ký ──────────────────────────────────
  const handleBackToForm = () => {
    setStep('form')
    setError(null)
    setOtpError(null)
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: 'var(--sp-10) auto',
        padding: '0 var(--sp-4)',
      }}
    >
      <Card
        className="catalog-card"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="register-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: 'var(--primary)',
                    borderRadius: 'var(--radius)',
                    margin: '0 auto var(--sp-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--card)',
                    border: '1px solid var(--border-strong)',
                  }}
                >
                  <IdcardOutlined style={{ fontSize: 22 }} />
                </div>
                <Title
                  level={3}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    margin: '0 0 var(--sp-1)',
                    color: 'var(--foreground)',
                  }}
                >
                  Đăng Ký Thẻ Thư Viện
                </Title>
                <Text style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
                  Cấp thẻ Bạn đọc trực tuyến và kích hoạt tài khoản qua xác thực email
                </Text>
              </div>

              {error && (
                <Alert
                  title={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius)' }}
                />
              )}

              <Form
                form={form}
                layout="vertical"
                onFinish={handleRegisterSubmit}
                onFinishFailed={handleRegisterFailed}
                requiredMark="optional"
              >
                {/* Tên đăng nhập */}
                <Form.Item
                  label="Tên đăng nhập"
                  name="username"
                  validateTrigger={touched.username ? ['onChange', 'onBlur'] : 'onBlur'}
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                    { min: 3, message: 'Tên đăng nhập phải từ 3 ký tự' },
                    {
                      pattern: /^[a-zA-Z0-9_]+$/,
                      message: 'Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới',
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={mutedTextStyle} />}
                    placeholder="nguyenvana"
                    size="large"
                    style={radiusStyle}
                    onBlur={() => markTouched('username')}
                  />
                </Form.Item>

                {/* Họ và tên */}
                <Form.Item
                  label="Họ và tên bạn đọc"
                  name="fullName"
                  validateTrigger={touched.fullName ? ['onChange', 'onBlur'] : 'onBlur'}
                  rules={[
                    { required: true, message: 'Vui lòng nhập họ và tên' },
                    { max: 150, message: 'Họ và tên tối đa 150 ký tự' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={mutedTextStyle} />}
                    placeholder="Nguyễn Văn A"
                    size="large"
                    style={radiusStyle}
                    onBlur={() => markTouched('fullName')}
                  />
                </Form.Item>

                {/* Email */}
                <Form.Item
                  label="Địa chỉ email"
                  name="email"
                  validateTrigger={touched.email ? ['onChange', 'onBlur'] : 'onBlur'}
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không đúng định dạng' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={mutedTextStyle} />}
                    placeholder="example@libri.id.vn"
                    size="large"
                    style={radiusStyle}
                    onBlur={() => markTouched('email')}
                  />
                </Form.Item>

                {/* Số điện thoại */}
                <Form.Item
                  label="Số điện thoại liên hệ"
                  name="phone"
                  validateTrigger={touched.phone ? ['onChange', 'onBlur'] : 'onBlur'}
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    {
                      pattern: /^(0|\+84|84)[35789]\d{8}$/,
                      message: 'Số điện thoại không hợp lệ',
                    },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined style={mutedTextStyle} />}
                    placeholder="0912345678"
                    size="large"
                    style={radiusStyle}
                    onBlur={() => markTouched('phone')}
                  />
                </Form.Item>

                {/* Mật khẩu */}
                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  validateTrigger={touched.password ? ['onChange', 'onBlur'] : 'onBlur'}
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 6, message: 'Mật khẩu phải từ 6 ký tự' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={mutedTextStyle} />}
                    placeholder="Tối thiểu 6 ký tự..."
                    size="large"
                    style={radiusStyle}
                    onBlur={() => markTouched('password')}
                  />
                </Form.Item>

                {/* Xác nhận mật khẩu */}
                <Form.Item
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  dependencies={['password']}
                  validateTrigger={touched.confirmPassword ? ['onChange', 'onBlur'] : 'onBlur'}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={mutedTextStyle} />}
                    placeholder="Nhập lại mật khẩu..."
                    size="large"
                    style={radiusStyle}
                    onBlur={() => markTouched('confirmPassword')}
                  />
                </Form.Item>

                {/* Ô tick đồng ý quy định thư viện */}
                <div style={{ marginTop: 'var(--sp-4)', marginBottom: 'var(--sp-2)' }}>
                  <Checkbox
                    checked={agreePolicy}
                    onChange={(e) => setAgreePolicy(e.target.checked)}
                    style={{ fontSize: 13.5, lineHeight: 1.5, alignItems: 'flex-start' }}
                  >
                    <span>Tôi đã đọc và đồng ý với </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setPolicyModalOpen(true)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          setPolicyModalOpen(true)
                        }
                      }}
                      style={{
                        color: 'var(--primary)',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      quy định của thư viện
                    </span>
                  </Checkbox>
                </div>

                <Form.Item style={{ marginTop: 'var(--sp-4)' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loading}
                    disabled={!agreePolicy || loading}
                    style={{
                      background: !agreePolicy || loading ? undefined : 'var(--primary)',
                      borderColor: !agreePolicy || loading ? undefined : 'var(--primary)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    Đăng ký
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center', fontSize: 13 }}>
                <span style={mutedTextStyle}>Đã có tài khoản thẻ? </span>
                <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Đăng nhập ngay
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="verify-otp-screen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    background: 'rgba(31, 58, 46, 0.1)',
                    borderRadius: '50%',
                    margin: '0 auto var(--sp-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <MailOutlined style={{ fontSize: 26 }} />
                </div>
                <Title
                  level={3}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    margin: '0 0 var(--sp-1)',
                    color: 'var(--foreground)',
                  }}
                >
                  Xác thực email
                </Title>
                <Text style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>
                  Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến email của bạn.
                </Text>
                <div style={{ marginTop: 'var(--sp-2)' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'var(--card-subtle, rgba(0, 0, 0, 0.04))',
                      padding: '4px 12px',
                      borderRadius: 16,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {maskEmail(registeredEmail)}
                  </span>
                </div>
              </div>

              {emailWarning && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius)' }}
                  message="Lưu ý về gửi email mã xác thực"
                  description={
                    <div>
                      <div>{emailWarning}</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        Bạn có thể kiểm tra hộp thư rác (Spam) hoặc bấm <strong>"Gửi lại mã"</strong> sau khi hết thời gian chờ. Nếu sai địa chỉ email, hãy bấm <strong>"Quay lại chỉnh sửa thông tin"</strong>.
                      </div>
                    </div>
                  }
                />
              )}

              {otpError && (
                <Alert
                  message={otpError}
                  type="error"
                  showIcon
                  style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius)' }}
                />
              )}

              {/* Ô nhập OTP 6 chữ số */}
              <div style={{ marginBottom: 'var(--sp-6)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 'var(--sp-3)',
                  }}
                >
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      spellCheck={false}
                      pattern="[0-9]*"
                      maxLength={index === 5 ? 1 : 6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      disabled={verifying}
                      style={{
                        width: '100%',
                        maxWidth: 60,
                        height: 52,
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        borderRadius: 'var(--radius)',
                        border: digit
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-strong)',
                        backgroundColor: 'var(--input-bg, #fff)',
                        color: 'var(--foreground)',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </div>

                {/* Bộ đếm thời gian hiệu lực OTP */}
                <div style={{ textAlign: 'center', fontSize: 13 }}>
                  {otpTimeLeft > 0 ? (
                    <Text type="secondary">
                      Mã có hiệu lực trong:{' '}
                      <strong style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {formatTimer(otpTimeLeft)}
                      </strong>
                    </Text>
                  ) : (
                    <Text type="danger" style={{ fontWeight: 600 }}>
                      Mã xác thực đã hết hạn. Vui lòng bấm "Gửi lại mã" bên dưới.
                    </Text>
                  )}
                </div>
              </div>

              {/* Nút Xác nhận */}
              <Button
                type="primary"
                block
                size="large"
                loading={verifying}
                onClick={handleVerifyOtp}
                disabled={otpDigits.join('').length < 6 || verifying}
                style={{
                  background: 'var(--primary)',
                  borderColor: 'var(--primary)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius)',
                  height: 44,
                  fontSize: 15,
                  marginBottom: 'var(--sp-4)',
                }}
              >
                Xác nhận
              </Button>

              {/* Gửi lại mã OTP */}
              <div style={{ textAlign: 'center', fontSize: 13, marginBottom: 'var(--sp-4)' }}>
                <span style={mutedTextStyle}>Chưa nhận được mã? </span>
                {resendCooldown > 0 ? (
                  <Text type="secondary" style={{ fontStyle: 'italic' }}>
                    Gửi lại sau ({resendCooldown}s)
                  </Text>
                ) : (
                  <Button
                    type="link"
                    loading={resending}
                    onClick={handleResendOtp}
                    style={{
                      padding: 0,
                      fontWeight: 600,
                      color: 'var(--primary)',
                      fontSize: 13,
                    }}
                  >
                    Gửi lại mã
                  </Button>
                )}
              </div>

              {/* Nút quay lại chỉnh sửa thông tin */}
              <div style={{ textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-3)' }}>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToForm}
                  style={{
                    color: 'var(--muted-foreground)',
                    fontSize: 13,
                  }}
                >
                  Quay lại chỉnh sửa thông tin
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Modal hiển thị quy định thư viện Domus Libri */}
      <LibraryPolicyModal
        open={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        onAgree={() => {
          setAgreePolicy(true)
          setPolicyModalOpen(false)
        }}
      />
    </div>
  )
}
