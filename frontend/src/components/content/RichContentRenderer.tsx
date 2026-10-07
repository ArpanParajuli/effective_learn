import * as React from 'react'
import { ExternalLink, Globe, Film, Check, Copy } from 'lucide-react'

interface RichContentRendererProps {
  content: string
}

function parseYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export function RichContentRenderer({ content }: RichContentRendererProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Split into paragraphs / blocks
  const blocks = React.useMemo(() => {
    return content.split('\n\n').map((b) => b.trim()).filter(Boolean)
  }, [content])

  return (
    <div className="prose-reader space-y-6">
      {blocks.map((block, index) => {
        // 1. Video Embed tag: [video:URL]
        if (block.startsWith('[video:') && block.endsWith(']')) {
          const videoUrl = block.slice(7, -1).trim()
          const youtubeId = parseYouTubeId(videoUrl)

          return (
            <div
              key={index}
              className="my-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shadow-sm"
            >
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-900/80">
                <Film className="h-4 w-4 text-indigo-500" />
                <span className="font-medium">Embedded Video Lecture</span>
                <span className="text-slate-400">•</span>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:underline text-indigo-600 dark:text-indigo-400 max-w-sm"
                >
                  {videoUrl}
                </a>
              </div>
              <div className="relative aspect-video w-full">
                {youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="Embedded video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                ) : (
                  <video
                    src={videoUrl}
                    controls
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          )
        }

        // 2. Website Embed tag: [website:URL] or [website:URL|Title]
        if (block.startsWith('[website:') && block.endsWith(']')) {
          const raw = block.slice(9, -1).trim()
          const [url, title] = raw.includes('|') ? raw.split('|') : [raw, raw]
          let hostname = url
          try {
            hostname = new URL(url).hostname
          } catch {
            // keep raw
          }

          return (
            <div
              key={index}
              className="my-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 p-2.5 text-indigo-600 dark:text-indigo-400">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {title.trim()}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {hostname}
                    </p>
                  </div>
                </div>
                <a
                  href={url.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Visit <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </div>
            </div>
          )
        }

        // 3. Code Blocks
        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.split('\n')
          const language = lines[0].replace('```', '').trim() || 'text'
          const code = lines.slice(1, -1).join('\n')

          return (
            <div
              key={index}
              className="relative my-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 overflow-hidden text-xs sm:text-sm font-mono shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2 text-slate-400 text-xs">
                <span>{language}</span>
                <button
                  onClick={() => handleCopy(code, index)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto m-0 bg-transparent text-slate-200">
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        // 4. Headings
        if (block.startsWith('# ')) {
          return (
            <h1 key={index} className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-8 mb-4">
              {block.slice(2)}
            </h1>
          )
        }
        if (block.startsWith('## ')) {
          return (
            <h2 key={index} className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              {block.slice(3)}
            </h2>
          )
        }
        if (block.startsWith('### ')) {
          return (
            <h3 key={index} className="text-lg font-semibold text-slate-900 dark:text-slate-200 mt-5 mb-2">
              {block.slice(4)}
            </h3>
          )
        }

        // 5. Blockquote
        if (block.startsWith('> ')) {
          return (
            <blockquote
              key={index}
              className="my-4 border-l-4 border-indigo-500 pl-4 py-1 italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 rounded-r-md"
            >
              {block.slice(2)}
            </blockquote>
          )
        }

        // 6. Bullet lists
        if (block.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
          const items = block.split('\n').map((line) => line.trim().slice(2))
          return (
            <ul key={index} className="my-4 list-disc pl-6 space-y-1.5 text-slate-700 dark:text-slate-300">
              {items.map((item, idx) => (
                <li key={idx}>{renderInlineMarkdown(item)}</li>
              ))}
            </ul>
          )
        }

        // 7. Standard Paragraph
        return (
          <p key={index} className="leading-relaxed text-slate-700 dark:text-slate-300 my-4 text-base sm:text-lg">
            {renderInlineMarkdown(block)}
          </p>
        )
      })}
    </div>
  )
}

function renderInlineMarkdown(text: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const label = match[1]
    const url = match[2]
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-indigo-600 dark:text-indigo-400 underline underline-offset-4 hover:opacity-80 inline-flex items-center gap-0.5"
      >
        {label} <ExternalLink className="h-3 w-3 inline" />
      </a>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}
