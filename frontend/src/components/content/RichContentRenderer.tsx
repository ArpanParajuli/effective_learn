import * as React from 'react'
import {
  ExternalLink,
  Globe,
  Film,
  Check,
  Copy,
  AlertCircle,
  Info,
  Lightbulb,
  AlertTriangle,
  Flame,
  ZoomIn,
  X,
} from 'lucide-react'
import { marked, type Tokens, type Token } from 'marked'
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
      // fallback
    }
  }
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function RichContentRenderer({
  content,
  fontFamily,
  fontSize,
  className,
}: RichContentRendererProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Parse markdown AST using marked.lexer
  const tokens = React.useMemo(() => {
    if (!content) return []
    try {
      return marked.lexer(content, { gfm: true, breaks: true })
    } catch {
      return []
    }
  }, [content])

  // Recursive inline tokens renderer: handles **bold**, *italic*, ~~strike~~, `code`, [link](url), etc.
  const renderInlineTokens = (inlineTokens?: Token[]): React.ReactNode => {
    if (!inlineTokens || inlineTokens.length === 0) return null

    return inlineTokens.map((token, idx) => {
      switch (token.type) {
        case 'strong':
          return (
            <strong key={idx} className="font-bold text-foreground">
              {renderInlineTokens((token as Tokens.Strong).tokens)}
            </strong>
          )
        case 'em':
          return (
            <em key={idx} className="italic text-foreground">
              {renderInlineTokens((token as Tokens.Em).tokens)}
            </em>
          )
        case 'del':
          return (
            <del key={idx} className="line-through text-muted-foreground opacity-75">
              {renderInlineTokens((token as Tokens.Del).tokens)}
            </del>
          )
        case 'codespan':
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 rounded-md font-mono text-[0.875em] bg-muted/80 text-foreground border border-border/80 font-semibold"
            >
              {(token as Tokens.Codespan).text}
            </code>
          )
        case 'link': {
          const linkToken = token as Tokens.Link
          return (
            <a
              key={idx}
              href={linkToken.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-500 transition-colors font-medium inline-flex items-center gap-0.5"
            >
              {renderInlineTokens(linkToken.tokens)}
              <ExternalLink className="h-3 w-3 inline ml-0.5 opacity-60" />
            </a>
          )
        }
        case 'image': {
          const imgToken = token as Tokens.Image
          return (
            <img
              key={idx}
              src={imgToken.href}
              alt={imgToken.text || 'Image'}
              onClick={() => setLightboxImage(imgToken.href)}
              className="max-h-[500px] rounded-xl my-3 object-contain cursor-zoom-in border border-border shadow-xs"
              loading="lazy"
            />
          )
        }
        case 'text': {
          const textToken = token as Tokens.Text
          return textToken.tokens ? (
            <React.Fragment key={idx}>{renderInlineTokens(textToken.tokens)}</React.Fragment>
          ) : (
            <React.Fragment key={idx}>{textToken.text}</React.Fragment>
          )
        }
        default:
          return <React.Fragment key={idx}>{token.raw}</React.Fragment>
      }
    })
  }

  // Render individual block tokens
  const renderBlockToken = (token: Token, index: number): React.ReactNode => {
    switch (token.type) {
      // 1. Table
      case 'table': {
        const tableToken = token as Tokens.Table
        return (
          <div
            key={index}
            className="my-6 overflow-x-auto rounded-xl border border-border shadow-xs bg-card"
          >
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-muted/80 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  {tableToken.header.map((cell, cIdx) => (
                    <th
                      key={cIdx}
                      className="py-3 px-4 font-semibold"
                      style={{ textAlign: tableToken.align[cIdx] || 'left' }}
                    >
                      {renderInlineTokens(cell.tokens)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tableToken.rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="py-3 px-4 text-foreground"
                        style={{ textAlign: tableToken.align[cIdx] || 'left' }}
                      >
                        {renderInlineTokens(cell.tokens)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      // 2. Syntax-Highlighted Code Block
      case 'code': {
        const codeToken = token as Tokens.Code
        const language = codeToken.lang || 'text'
        const code = codeToken.text
        const highlightedHtml = highlightCode(code, language)
        const codeLines = code.split('\n')
        const isCopied = copiedIndex === index

        return (
          <div
            key={index}
            className="relative my-6 rounded-xl border border-border bg-zinc-950 text-zinc-100 overflow-hidden text-xs sm:text-sm font-mono shadow-md"
          >
            {/* Code Window Header Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/90 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700 inline-block" />
                <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-300">
                  {language}
                </span>
                <span className="text-[10px] text-zinc-500">({codeLines.length} lines)</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(code, index)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Copy code"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Body */}
            <pre className="p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed m-0 bg-transparent">
              <code
                className={`language-${language} code-obsidian`}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            </pre>
          </div>
        )
      }

      // 3. Headings with Anchors
      case 'heading': {
        const headingToken = token as Tokens.Heading
        const text = headingToken.text
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
        const inlineContent = renderInlineTokens(headingToken.tokens)

        if (headingToken.depth === 1) {
          return (
            <h1
              key={index}
              id={id}
              className="scroll-m-20 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-12 mb-5 first:mt-0 leading-tight"
            >
              {inlineContent}
            </h1>
          )
        }
        if (headingToken.depth === 2) {
          return (
            <h2
              key={index}
              id={id}
              className="scroll-m-20 border-b border-border/80 pb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground first:mt-0 mt-10 mb-4 leading-snug"
            >
              {inlineContent}
            </h2>
          )
        }
        if (headingToken.depth === 3) {
          return (
            <h3
              key={index}
              id={id}
              className="scroll-m-20 text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-8 mb-3"
            >
              {inlineContent}
            </h3>
          )
        }
        return (
          <h4
            key={index}
            id={id}
            className="scroll-m-20 text-lg font-semibold tracking-tight text-foreground mt-6 mb-2"
          >
            {inlineContent}
          </h4>
        )
      }

      // 4. Blockquotes & GitHub-Style Alert Callouts
      case 'blockquote': {
        const bqToken = token as Tokens.Blockquote
        const raw = bqToken.raw.trim()

        // Check for GitHub alert callouts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
        const alertMatch = raw.match(
          /^>\s*\[!(NOTE|INFO|TIP|IMPORTANT|WARNING|WARN|CAUTION)\](?:\s*\n)?([\s\S]*)$/i
        )

        if (alertMatch) {
          const type = alertMatch[1].toUpperCase()
          const rawBody = alertMatch[2]
            .split('\n')
            .map((line) => line.replace(/^>\s?/, ''))
            .join('\n')
            .trim()

          const isTip = type === 'TIP'
          const isWarn = type === 'WARNING' || type === 'WARN'
          const isCaution = type === 'CAUTION'
          const isImportant = type === 'IMPORTANT'

          const borderColor = isTip
            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100'
            : isWarn
            ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100'
            : isCaution
            ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100'
            : isImportant
            ? 'border-violet-500 bg-violet-50/40 dark:bg-violet-950/20 text-violet-950 dark:text-violet-100'
            : 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100'

          const Icon = isTip
            ? Lightbulb
            : isWarn
            ? AlertTriangle
            : isCaution
            ? Flame
            : isImportant
            ? AlertCircle
            : Info

          const parsedHtml = rawBody
            ? (marked.parse(rawBody, { async: false, breaks: true }) as string)
            : ''

          return (
            <div
              key={index}
              className={`my-6 rounded-xl border-l-4 p-4 border border-border shadow-xs ${borderColor}`}
            >
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{type}</span>
              </div>
              <div
                className="text-sm leading-relaxed text-foreground/90 space-y-1.5 [&_p]:m-0 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-black/10 dark:[&_code]:bg-white/10 [&_code]:font-mono [&_code]:text-xs [&_a]:underline font-normal"
                dangerouslySetInnerHTML={{ __html: parsedHtml }}
              />
            </div>
          )
        }

        return (
          <blockquote
            key={index}
            className="my-6 border-l-2 border-indigo-500/70 dark:border-indigo-400 pl-6 italic text-muted-foreground leading-relaxed"
          >
            {renderInlineTokens(bqToken.tokens)}
          </blockquote>
        )
      }

      // 5. Lists (Ordered, Unordered, Task lists)
      case 'list': {
        const listToken = token as Tokens.List
        const ListTag = listToken.ordered ? 'ol' : 'ul'
        const listClass = listToken.ordered
          ? 'my-5 ml-6 list-decimal space-y-2 text-foreground'
          : 'my-5 ml-6 list-disc space-y-2 text-foreground'

        return (
          <ListTag key={index} className={listClass}>
            {listToken.items.map((item, itemIdx) => {
              const isTask = item.task
              return (
                <li key={itemIdx} className={`leading-relaxed ${isTask ? 'list-none -ml-4 flex items-start gap-2' : ''}`}>
                  {isTask && (
                    <input
                      type="checkbox"
                      checked={item.checked}
                      readOnly
                      className="mt-1 h-3.5 w-3.5 rounded border-border text-indigo-600 focus:ring-0 cursor-default"
                    />
                  )}
                  <span>{renderInlineTokens(item.tokens)}</span>
                </li>
              )
            })}
          </ListTag>
        )
      }

      // 6. Horizontal Rule
      case 'hr':
        return <hr key={index} className="my-8 border-border/80" />

      // 7. Paragraph & Custom Embeds: [video:...], [website:...], Standalone URLs, ![img](...)
      case 'paragraph': {
        const pToken = token as Tokens.Paragraph
        const raw = pToken.raw.trim()

        // 7a. Video Embed: [video:URL]
        if (raw.startsWith('[video:') && raw.endsWith(']')) {
          const videoUrl = raw.slice(7, -1).trim()
          const youtubeId = parseYouTubeId(videoUrl)

          return (
            <div
              key={index}
              className="my-6 overflow-hidden rounded-xl border border-border bg-card shadow-xs"
            >
              <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground bg-muted/60">
                <Film className="h-4 w-4 text-indigo-500" />
                <span className="font-semibold text-foreground">Video Lecture</span>
                <span className="text-muted-foreground">•</span>
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
                  <video src={videoUrl} controls className="h-full w-full object-cover" />
                )}
              </div>
            </div>
          )
        }

        // 7b. Website Bookmark: [website:URL] or [website:URL|Title] or standalone HTTP link or single-link paragraph
        const isBookmarkTag = raw.startsWith('[website:') && raw.endsWith(']')
        const cleanRaw = raw.replace(/^<|>$/g, '').trim()
        const isStandaloneHttp = /^https?:\/\/[^\s]+$/i.test(cleanRaw)
        const isSingleLink = Boolean(
          pToken.tokens && pToken.tokens.length === 1 && pToken.tokens[0].type === 'link'
        )

        if (isBookmarkTag || isStandaloneHttp || isSingleLink) {
          let url = ''
          let title = ''

          if (isBookmarkTag) {
            const contentStr = raw.slice(9, -1).trim()
            if (contentStr.includes('|')) {
              const parts = contentStr.split('|')
              url = parts[0].trim()
              title = parts[1].trim()
            } else {
              url = contentStr
              title = contentStr
            }
          } else if (isSingleLink && pToken.tokens) {
            const linkTok = pToken.tokens[0] as Tokens.Link
            url = linkTok.href.trim()
            title = linkTok.text.trim()
          } else {
            url = cleanRaw
            title = cleanRaw
          }

          let hostname = url
          let pathTitle = ''
          try {
            const parsed = new URL(url)
            hostname = parsed.hostname.replace(/^www\./, '')
            const pathSegments = parsed.pathname.split('/').filter(Boolean)
            if (pathSegments.length > 0) {
              const lastSeg = pathSegments[pathSegments.length - 1]
              pathTitle = lastSeg
                .replace(/[-_]/g, ' ')
                .replace(/\.(html|php|aspx|md)$/, '')
                .replace(/\b\w/g, (c) => c.toUpperCase())
            }
          } catch {
            // fallback
          }

          // Clean title if it was just the raw url
          const displayTitle =
            !title || title === url || /^https?:\/\//i.test(title)
              ? pathTitle
                ? `${pathTitle} · ${hostname}`
                : hostname
              : title

          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="my-5 flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-indigo-500/40 p-4 transition-all hover:shadow-xs group no-underline text-foreground cursor-pointer block"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                    {displayTitle}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                    {hostname}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground shadow-2xs shrink-0 transition-colors">
                <span>Visit</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </a>
          )
        }

        // 7c. Full block image: ![alt](url)
        const imgMatch = raw.match(/^!\[(.*?)\]\((.*?)\)$/)
        if (imgMatch) {
          const alt = imgMatch[1].trim()
          const src = imgMatch[2].trim()

          return (
            <figure key={index} className="my-6 space-y-2">
              <div
                onClick={() => setLightboxImage(src)}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xs cursor-zoom-in transition-all hover:border-zinc-700"
              >
                <img
                  src={src}
                  alt={alt || 'Technical diagram'}
                  className="w-full max-h-[520px] object-contain rounded-lg mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1 font-sans">
                  <ZoomIn className="h-3 w-3" /> Zoom
                </div>
              </div>
              {alt && (
                <figcaption className="text-center text-xs text-muted-foreground font-medium">
                  {alt}
                </figcaption>
              )}
            </figure>
          )
        }

        // 7d. Standard Paragraph with full inline tokens
        return (
          <p key={index} className="leading-7 [&:not(:first-child)]:mt-5 text-foreground">
            {renderInlineTokens(pToken.tokens)}
          </p>
        )
      }

      default:
        return null
    }
  }

  return (
    <div
      className={`typeset-docs prose-reader space-y-4 ${
        fontFamily === 'mono'
          ? 'font-canvas-mono'
          : fontFamily === 'sans'
          ? 'font-canvas-sans'
          : fontFamily === 'serif'
          ? 'font-canvas-serif'
          : ''
      } ${className || ''}`}
      style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
    >
      {tokens.map((token, index) => renderBlockToken(token, index))}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-zoom-out"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={lightboxImage}
              alt="Enlarged preview"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
