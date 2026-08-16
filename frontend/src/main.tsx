import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { I18nProvider } from './i18n'
import './index.css'

const initialDir = localStorage.getItem('taxiq_lang') === 'ar' ? 'rtl' : 'ltr'
document.documentElement.dir = initialDir

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
)
