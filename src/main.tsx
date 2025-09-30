import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import App from './App.tsx'
import './index.css'
import siteConfig from './config/site-config.json'
import { setConfig } from './store/slices/siteConfigSlice'

// Load site config into store
store.dispatch(setConfig(siteConfig as any))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
