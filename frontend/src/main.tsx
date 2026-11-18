import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Tự động tải lại trang khi phát hiện dynamic import bị lỗi do deploy bản mới (stale chunk trên Vite)
window.addEventListener('vite:preloadError', (event) => {
  const reloadKey = 'vite_preload_error_reload'
  const hasReloaded = sessionStorage.getItem(reloadKey)
  if (!hasReloaded) {
    sessionStorage.setItem(reloadKey, 'true')
    window.location.reload()
  } else {
    sessionStorage.removeItem(reloadKey)
    console.error('Không thể tải module động sau khi đã reload:', event)
  }
})

// Dọn dẹp cờ reload khi ứng dụng đã tải xong ổn định
window.addEventListener('load', () => {
  setTimeout(() => {
    sessionStorage.removeItem('vite_preload_error_reload')
  }, 5000)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
