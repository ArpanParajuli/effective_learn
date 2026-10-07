import * as React from 'react'
import { ExternalLink, Globe, Film, Check, Copy, AlertCircle, Info, Lightbulb, AlertTriangle, Image as ImageIcon } from 'lucide-react'
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

interface RichContentRendererProps {
  content: string
}

function parseYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

function highlightCode(code: string, language: string): string {
  const langKey = language.toLowerCase().trim()
  const langAliases: Record<string, string> = {
    cs: 'csharp',
    'c#': 'csharp',
    ts: 'typescript',
    js: 'javascript',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    docker: 'dockerfile',
  }
  const targetLang = langAliases[langKey] || langKey
  const grammar = Prism.languages[targetLang] || Prism.languages.javascript || Prism.languages.clike

  if (grammar) {
    try {
      return Prism.highlight(code, grammar, targetLang)
    } catch {
      // fallback to safe html escape
    }
  }
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function RichContentRenderer({ content }: RichContentRendererProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Split into blocks by double newline
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

        // 3. First-Class Image Embed: ![Alt / Caption](ImageURL)
        const imgMatch = block.match(/^!\[(.*?)\]\((.*?)\)$/)
        if (imgMatch) {
          const alt = imgMatch[1].trim()
          const src = imgMatch[2].trim()

          return (
            <figure key={index} className="my-6 space-y-2">
              <div
                onClick={() => setLightboxImage(src)}
                className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-1 shadow-sm cursor-zoom-in transition-all hover:border-slate-400 dark:hover:border-slate-600"
              >
                <img
                  src={src}
                  alt={alt || 'Technical diagram'}
                  className="w-full max-h-[520px] object-contain rounded-lg mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback visual if broken link
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> Zoom
                </div>
              </div>
              {alt && (
                <figcaption className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {alt}
                </figcaption>
              )}
            </figure>
          )
        }

        // 4. Obsidian-Grade Syntax-Highlighted Code Blocks
        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.split('\n')
          const language = lines[0].replace('```', '').trim() || 'text'
          const code = lines.slice(1, -1).join('\n')
          const highlightedHtml = highlightCode(code, language)
          const codeLines = code.split('\n')

          return (
            <div
              key={index}
              className="relative my-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#0d1117] text-slate-100 overflow-hidden text-xs sm:text-sm font-mono shadow-md"
            >
              {/* Obsidian-Style Code Window Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#161b22] px-4 py-2 text-slate-400 text-xs select-none">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider pl-1.5">
                    {language}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(code, index)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer text-xs"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Line Numbers + Highlighted Code Body */}
              <div className="overflow-x-auto p-4 flex gap-4 text-xs sm:text-sm leading-relaxed code-obsidian">
                <div className="select-none text-slate-600 dark:text-slate-500 text-right font-mono text-[11px] sm:text-xs leading-relaxed border-r border-slate-800/80 pr-3.5">
                  {codeLines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <pre className="m-0 flex-1 overflow-visible bg-transparent p-0 text-slate-200">
                  <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
                </pre>
              </div>
            </div>
          )
        }

        // 5. Obsidian / GitHub Markdown Callout: > [!NOTE], > [!TIP], > [!WARNING]
        if (block.startsWith('> [!')) {
          const calloutMatch = block.match(/^>\s*\[!(\w+)\]\s*([\s\S]*)/)
          if (calloutMatch) {
            const type = calloutMatch[1].toUpperCase()
            const text = calloutMatch[2].replace(/^>\s?/gm, '').trim()

            const isTip = type === 'TIP'
            const isWarn = type === 'WARNING' || type === 'CAUTION'
            const isImportant = type === 'IMPORTANT'

            const borderColor = isTip
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100'
              : isWarn
              ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100'
              : isImportant
              ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-100'
              : 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100'

            const Icon = isTip
              ? Lightbulb
              : isWarn
              ? AlertTriangle
              : isImportant
              ? AlertCircle
              : Info

            return (
              <div
                key={index}
                className={`my-5 rounded-xl border-l-4 p-4 border border-slate-200 dark:border-slate-800 ${borderColor}`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider mb-1.5">
                  <Icon className="h-4 w-4" />
                  <span>{type}</span>
                </div>
                <p className="text-sm leading-relaxed m-0">{text}</p>
              </div>
            )
          }
        }

        // 6. Regular Blockquote
        if (block.startsWith('> ')) {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-slate-300 dark:border-slate-700 pl-4 py-1 italic text-slate-600 dark:text-slate-400 my-4"
            >
              {block.slice(2)}
            </blockquote>
          )
        }

        // 7. Headings
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

        // 8. Bullet List
        if (block.startsWith('- ') || block.startsWith('* ')) {
          const items = block.split('\n').map((line) => line.trim().slice(2))
          return (
            <ul key={index} className="space-y-1.5 my-4 list-disc pl-5 text-slate-700 dark:text-slate-300">
              {items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )
        }

        // 9. Numbered List
        if (/^\d+\.\s/.test(block)) {
          const items = block.split('\n').map((line) => line.replace(/^\d+\.\s/, '').trim())
          return (
            <ol key={index} className="space-y-1.5 my-4 list-decimal pl-5 text-slate-700 dark:text-slate-300">
              {items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
          )
        }

        // 10. Horizontal Rule
        if (block === '---' || block === '***') {
          return <hr key={index} className="my-8 border-slate-200 dark:border-slate-800" />
        }

        // 11. Default Paragraph
        return (
          <p key={index} className="text-slate-800 dark:text-slate-200 leading-relaxed my-4">
            {block}
          </p>
        )
      })}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-zoom-out"
        >
          <img
            src={lightboxImage}
            alt="Enlarged preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
