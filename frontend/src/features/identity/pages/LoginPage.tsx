import React, { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, Card, Alert, Typography } from 'antd'
import { appMessage as message } from '@/shared/utils/appFeedback'
import { UserOutlined, LockOutlined, MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { identityApi } from '../api'
import { useAuth } from '../authStore'
import type { LoginRequest } from '../types'
import type { CurrentUser } from '@/shared/api/types'
import { BRAND } from '@/shared/constants/brand'
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

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [form] = Form.useForm()
  const [activationForm] = Form.useForm()

  // Các bước: 'login' | 'request-activation' | 'verify-otp'
  const [step, setStep] = useState<'login' | 'request-activation' | 'verify-otp'>('login')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inactiveEmail, setInactiveEmail] = useState<string | null>(null)

  // Trạng thái xác thực OTP kích hoạt
  const [activationEmail, setActivationEmail] = useState<string>('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpTimeLeft, setOtpTimeLeft] = useState<number>(180)
  const [resendCooldown, setResendCooldown] = useState<number>(60)
  const [resending, setResending] = useState(false)

  // Tham chiếu các ô nhập OTP để tự động chuyển focus
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

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

  // ── Xử lý Đăng Nhập ───────────────────────────────────────────────────────
  const handleSubmit = async (values: LoginRequest) => {
    try {
      setLoading(true)
      setError(null)
      setInactiveEmail(null)
      const res = await identityApi.login(values)
      const currentUser: CurrentUser = res.user ?? {
        id: res.accountId,
        username: res.username,
        fullName: res.fullName,
        email: res.email,
        role: res.role as CurrentUser['role'],
      }
      setAuth(currentUser, res.accessToken, res.refreshToken)

      // Sau khi đăng nhập thành công, luôn đưa về Trang chủ
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Đăng nhập không thành công')
      if (msg.includes('|')) {
        const [cleanMsg, email] = msg.split('|')
        setError(cleanMsg)
        if (email && email.trim()) {
          setInactiveEmail(email.trim())
        }
      } else {
        setError(msg)
        setInactiveEmail(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Bắt đầu quy trình kích hoạt tài khoản ──────────────────────────────────
  const handleStartActivation = async (targetEmail: string) => {
    try {
      setResending(true)
      setError(null)
      setOtpError(null)
      await identityApi.resendEmailOtp({ email: targetEmail.trim() })

      setActivationEmail(targetEmail.trim())
      setOtpDigits(['', '', '', '', '', ''])
      setOtpTimeLeft(180)
      setResendCooldown(60)
      setStep('verify-otp')
      message.success(`Mã xác thực OTP mới đã được gửi đến ${maskEmail(targetEmail)}`)
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Không thể gửi mã xác thực. Vui lòng thử lại sau.'))
    } finally {
      setResending(false)
    }
  }

  // Gửi yêu cầu kích hoạt bằng form nhập email thủ công
  const handleRequestActivationSubmit = async (values: { email: string }) => {
    await handleStartActivation(values.email)
  }

  // ── Xử lý nhập mã OTP (Hỗ trợ bàn phím tiếng Việt Telex/VNI) ───────────────
  const handleOtpChange = (index: number, value: string) => {
    const rawVal = value.replace(/[^0-9]/g, '')

    if (rawVal.length > 1) {
      const chars = rawVal.slice(0, 6).split('')
      const next = [...otpDigits]
      chars.forEach((c, i) => {
        if (index + i < 6) next[index + i] = c
      })
      setOtpDigits(next)
      setOtpError(null)
      const nextIdx = Math.min(index + chars.length, 5)
      setTimeout(() => otpInputRefs.current[nextIdx]?.focus(), 15)
      return
    }

    const next = [...otpDigits]
    next[index] = rawVal
    setOtpDigits(next)
    setOtpError(null)

    if (rawVal && index < 5) {
      setTimeout(() => {
        otpInputRefs.current[index + 1]?.focus()
      }, 15)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((c, i) => {
      if (i < 6) next[i] = c
    })
    setOtpDigits(next)
    setOtpError(null)
    const focusIdx = Math.min(pasted.length, 5)
    setTimeout(() => otpInputRefs.current[focusIdx]?.focus(), 15)
  }

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return
    try {
      setResending(true)
      setOtpError(null)
      await identityApi.resendEmailOtp({ email: activationEmail })
      setOtpTimeLeft(180)
      setResendCooldown(60)
      setOtpDigits(['', '', '', '', '', ''])
      message.success(`Mã xác thực mới đã được gửi đến ${maskEmail(activationEmail)}`)
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      setOtpError(getErrorMessage(err, 'Không thể gửi lại mã xác thực. Vui lòng thử lại sau.'))
    } finally {
      setResending(false)
    }
  }

  // Xác thực mã OTP và tự động đăng nhập
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('').trim()
    if (otp.length < 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã xác thực.')
      return
    }

    try {
      setVerifying(true)
      setOtpError(null)

      const verifyRes = await identityApi.verifyEmailOtp({
        email: activationEmail,
        otp,
      })

      // Đăng nhập tự động ngay sau khi kích hoạt thành công
      if (verifyRes?.accessToken) {
        const currentUser: CurrentUser = {
          id: verifyRes.accountId,
          username: verifyRes.username,
          fullName: verifyRes.fullName,
          email: verifyRes.email,
          role: verifyRes.role as CurrentUser['role'],
        }
        setAuth(currentUser, verifyRes.accessToken, verifyRes.refreshToken)
        message.success('Kích hoạt tài khoản và đăng nhập thành công!')
        navigate('/', { replace: true })
      } else {
        message.success('Kích hoạt tài khoản thành công! Vui lòng đăng nhập.')
        setStep('login')
        form.setFieldsValue({ username: activationEmail })
      }
    } catch (err: unknown) {
      setOtpError(getErrorMessage(err, 'Mã xác thực không hợp lệ hoặc đã hết hạn.'))
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 460,
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
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
          <img
            src={BRAND.logoDark}
            alt={BRAND.name}
            style={{
              width: 54,
              height: 54,
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto var(--sp-3)',
            }}
          />
          <Title
            level={3}
            style={{
              fontFamily: 'var(--font-serif)',
              margin: '0 0 var(--sp-1)',
              color: 'var(--foreground)',
            }}
          >
            {step === 'verify-otp'
              ? 'Xác Thực Tài Khoản'
              : step === 'request-activation'
              ? 'Kích Hoạt Tài Khoản'
              : 'Đăng Nhập Thư Viện'}
          </Title>
          <Text style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>
            {step === 'verify-otp'
              ? `Nhập mã xác thực 6 số gửi tới ${maskEmail(activationEmail)}`
              : step === 'request-activation'
              ? 'Nhập email đã đăng ký để nhận mã OTP kích hoạt'
              : 'Cổng thông tin Bạn đọc & Cán bộ Thư viện'}
          </Text>
        </div>

        <AnimatePresence mode="wait">
          {/* BƯỚC 1: FORM ĐĂNG NHẬP CHÍNH */}
          {step === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {error && (
                <Alert
                  message={error}
                  description={
                    inactiveEmail ? (
                      <div style={{ marginTop: 'var(--sp-2)' }}>
                        <Button
                          type="primary"
                          size="small"
                          loading={resending}
                          onClick={() => handleStartActivation(inactiveEmail)}
                          style={{
                            background: 'var(--primary)',
                            borderColor: 'var(--primary)',
                            fontWeight: 600,
                            borderRadius: 'var(--radius)',
                          }}
                        >
                          Gửi mã OTP & Kích hoạt ngay
                        </Button>
                      </div>
                    ) : null
                  }
                  type={inactiveEmail ? 'warning' : 'error'}
                  showIcon
                  style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius)' }}
                />
              )}

              <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
                <Form.Item
                  label="Tên đăng nhập hoặc Email"
                  name="username"
                  rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập hoặc email' }]}
                >
                  <Input
                    prefix={<UserOutlined style={mutedTextStyle} />}
                    placeholder="Nhập tên đăng nhập hoặc email..."
                    size="large"
                    style={radiusStyle}
                  />
                </Form.Item>

                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={mutedTextStyle} />}
                    placeholder="Nhập mật khẩu..."
                    size="large"
                    style={radiusStyle}
                  />
                </Form.Item>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: -8,
                    marginBottom: 'var(--sp-4)',
                  }}
                >
                  <Link
                    to="/forgot-password"
                    style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                <Form.Item style={{ marginTop: 'var(--sp-4)' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loading}
                    style={{
                      background: 'var(--primary)',
                      borderColor: 'var(--primary)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    Đăng nhập
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center', fontSize: 13, marginBottom: 'var(--sp-2)' }}>
                <span style={mutedTextStyle}>Chưa có thẻ thư viện? </span>
                <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Đăng ký thẻ ngay
                </Link>
              </div>

              <div style={{ textAlign: 'center', fontSize: 13 }}>
                <span style={mutedTextStyle}>Tài khoản chưa kích hoạt? </span>
                <Button
                  type="link"
                  onClick={() => {
                    setStep('request-activation')
                    setError(null)
                  }}
                  style={{ padding: 0, fontWeight: 600, color: 'var(--primary)', fontSize: 13 }}
                >
                  Kích hoạt tài khoản
                </Button>
              </div>
            </motion.div>
          )}

          {/* BƯỚC 2: YÊU CẦU GỬI OTP KÍCH HOẠT (NHẬP EMAIL) */}
          {step === 'request-activation' && (
            <motion.div
              key="request-activation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Form
                form={activationForm}
                layout="vertical"
                onFinish={handleRequestActivationSubmit}
                requiredMark="optional"
              >
                <Form.Item
                  label="Email tài khoản đã đăng ký"
                  name="email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập địa chỉ email' },
                    { type: 'email', message: 'Địa chỉ email không hợp lệ' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={mutedTextStyle} />}
                    placeholder="ví dụ: user@gmail.com..."
                    size="large"
                    style={radiusStyle}
                  />
                </Form.Item>

                <Form.Item style={{ marginTop: 'var(--sp-4)' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={resending}
                    style={{
                      background: 'var(--primary)',
                      borderColor: 'var(--primary)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    Gửi mã OTP kích hoạt
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-3)' }}>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    setStep('login')
                    setError(null)
                  }}
                  style={{ color: 'var(--muted-foreground)', fontSize: 13 }}
                >
                  Quay lại đăng nhập
                </Button>
              </div>
            </motion.div>
          )}

          {/* BƯỚC 3: MÀN HÌNH NHẬP MÃ OTP XÁC THỰC */}
          {step === 'verify-otp' && (
            <motion.div
              key="verify-otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {otpError && (
                <Alert
                  message={otpError}
                  type="error"
                  showIcon
                  style={{ marginBottom: 'var(--sp-4)', borderRadius: 'var(--radius)' }}
                />
              )}

              <div style={{ marginBottom: 'var(--sp-5)' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'center',
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
                        maxWidth: 58,
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
                Xác nhận kích hoạt
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

              {/* Quay lại form đăng nhập */}
              <div style={{ textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-3)' }}>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    setStep('login')
                    setOtpError(null)
                  }}
                  style={{ color: 'var(--muted-foreground)', fontSize: 13 }}
                >
                  Quay lại đăng nhập
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}
