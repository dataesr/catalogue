import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

import { isProduction } from '@/utils/helpers'

declare global {
  interface Window {
    _paq: any[]
  }
}

const MATOMO_URL = isProduction ? 'https://piwik.enseignementsup-recherche.pro/' : 'https://matomo.staging.dataesr.ovh/'
const SITE_ID = isProduction ? '56' : '8'

export function useMatomo() {
  const { pathname, search } = useLocation()
  const initialized = useRef(false)

  useEffect(() => {
    if (!MATOMO_URL || !SITE_ID) return

    if (!initialized.current) {
      initialized.current = true
      window._paq = window._paq || []
      window._paq.push(["setTrackerUrl", `${MATOMO_URL}matomo.php`])
      window._paq.push(["setSiteId", SITE_ID])
      window._paq.push(["enableLinkTracking"])
      const g = document.createElement("script")
      g.async = true
      g.src = `${MATOMO_URL}matomo.js`
      document.head.appendChild(g)
    }

    const url = pathname + search
    window._paq.push(["setCustomUrl", url])
    window._paq.push(["setDocumentTitle", document.title])
    window._paq.push(["trackPageView"])
  }, [pathname, search])
}