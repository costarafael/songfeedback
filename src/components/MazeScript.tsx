'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'

export default function MazeScript() {
  const pathname = usePathname()
  
  // Only load on public pages (not admin routes)
  const isAdminRoute = pathname.startsWith('/admin')
  
  if (isAdminRoute) {
    return null
  }

  return (
    <Script
      id="maze-universal-snippet"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function (m, a, z, e) {
  var s, t;
  try {
    t = m.sessionStorage.getItem('maze-us');
  } catch (err) {}

  if (!t) {
    t = new Date().getTime();
    try {
      m.sessionStorage.setItem('maze-us', t);
    } catch (err) {}
  }

  s = a.createElement('script');
  s.src = z + '?apiKey=' + e;
  s.async = true;
  a.getElementsByTagName('head')[0].appendChild(s);
  m.mazeUniversalSnippetApiKey = e;
})(window, document, 'https://snippet.maze.co/maze-universal-loader.js', 'c1bc4362-d982-4c41-b843-6adf8633766a');
        `
      }}
    />
  )
}