import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/inter'
import '@/kit/styles/index.css'
import '@/contest/styles/index.css'
import '@/apps/contest/styles/index.css'
import { SAVED_CONFIG } from '@/apps/contest/settings'
import { adapter } from '@/apps/contest/data'
import { ContestProvider } from '@/contest/context/ContestContext'
import { ConfigProvider } from '@/kit/context/ConfigContext'
import { ToastProvider } from '@/kit/context/ToastContext'
import { bootstrapTheme } from '@/kit/theme/theme'
import { App } from './App'

// Apply the saved theme before the first render so there is no flash of default colors.
bootstrapTheme(SAVED_CONFIG)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ConfigProvider saved={SAVED_CONFIG}>
        <ContestProvider adapter={adapter}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ContestProvider>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
