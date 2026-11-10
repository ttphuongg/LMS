import React from 'react'
import { ConfigProvider, App as AntdApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { libraryTheme } from './theme'
import { initAuthAdapter } from '@/features/identity'
import { AntdFeedbackInitializer } from '@/shared/utils/appFeedback'

// Khởi tạo AuthAdapter kết nối apiClient với Identity Store
initAuthAdapter()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 3, // 3 phút
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={libraryTheme} locale={viVN}>
        <AntdApp>
          <AntdFeedbackInitializer />
          {children}
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
