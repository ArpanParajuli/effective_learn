import * as React from 'react'
import { marked } from 'marked'
import Prism from 'prismjs'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-docker'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-css'

export interface RichContentRendererProps {
  content: string
  fontFamily?: 'mono' | 'sans' | 'serif'
  fontSize?: number
  className?: string
}

marked.setOptions({
  gfm: true,
  breaks: true,
})

export function RichContentRenderer({
  content,
  fontFamily,
  fontSize,
  className,
}: RichContentRendererProps) {
  const html = React.useMemo(() => {
    try {
      return marked.parse(content || '')
    } catch {
      return ''
    }
  }, [content])

  React.useEffect(() => {
    Prism.highlightAll()
  }, [html])

  return (
    <div
      className={`typeset typeset-docs ${
        fontFamily === 'mono'
          ? 'font-canvas-mono'
          : fontFamily === 'sans'
          ? 'font-canvas-sans'
          : fontFamily === 'serif'
          ? 'font-canvas-serif'
          : ''
      } ${className || ''}`}
      style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
      dangerouslySetInnerHTML={{ __html: html as string }}
    />
  )
}
