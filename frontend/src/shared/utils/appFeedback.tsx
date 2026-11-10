import React, { useEffect } from 'react'
import { App, message as staticMessage } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'

let messageInstance: MessageInstance = staticMessage

/**
 * Cầu nối trích xuất instance `message` gắn Context của Ant Design `<App>`
 * để dùng an toàn trong các component/hook mà không gây warning "Static function can not consume context".
 */
export const AntdFeedbackInitializer: React.FC = () => {
  const { message } = App.useApp()

  useEffect(() => {
    messageInstance = message
    return () => {
      messageInstance = staticMessage
    }
  }, [message])

  return null
}

export const appMessage: MessageInstance = {
  info: (...args) => messageInstance.info(...args),
  success: (...args) => messageInstance.success(...args),
  error: (...args) => messageInstance.error(...args),
  warning: (...args) => messageInstance.warning(...args),
  loading: (...args) => messageInstance.loading(...args),
  open: (args) => messageInstance.open(args),
  destroy: (key) => messageInstance.destroy(key),
}
