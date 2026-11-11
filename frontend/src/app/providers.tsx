import React from 'react'
import { ConfigProvider, App as AntdApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { libraryTheme } from './theme'
import { initAuthAdapter } from '@/features/identity'
import { AntdFeedbackInitializer } from '@/shared/utils/appFeedback'

// Khởi tạo AuthAdapter kết nối apiClient với Identity Store
initAuthAdapter()

interface ProvidersProps {
  children: React.ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ConfigProvider theme={libraryTheme} locale={viVN}>
      <AntdApp>
        <AntdFeedbackInitializer />
        {children}
      </AntdApp>
    </ConfigProvider>
  )
}
