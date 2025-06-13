// ui/src/pages/_app.tsx
import '@/styles/globals.css' // Assuming you will create this file
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
