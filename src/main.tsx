import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/inter'
import './styles/index.css'
import { bootstrapTheme } from './config/theme'
import { AuthProvider } from './context/AuthContext'
import { ConfigProvider } from './context/ConfigContext'
import { ToastProvider } from './context/ToastContext'
import { App } from './App'

// Apply the saved theme before the first render so there is no flash of default colors.
bootstrapTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ConfigProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
