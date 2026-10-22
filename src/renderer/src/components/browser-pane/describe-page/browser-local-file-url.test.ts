// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { browserFileUrlToAbsolutePath, getLocalHtmlFileFromBrowserUrl } from './browser-local-file-url'

describe('browser local file URLs', () => {
  it('recognizes local HTML URLs across path flavors', () => {
    expect(getLocalHtmlFileFromBrowserUrl('file:///tmp/Design%20Review.html')).toEqual({
      fileName: 'Design Review.html',
      filePath: '/tmp/Design Review.html'
    })
    expect(getLocalHtmlFileFromBrowserUrl('file:///C:/repo/report.HTM')).toEqual({
      fileName: 'report.HTM',
      filePath: 'C:\\repo\\report.HTM'
    })
    expect(getLocalHtmlFileFromBrowserUrl('file://server/share/report.html')).toEqual({
      fileName: 'report.html',
      filePath: '\\\\server\\share\\report.html'
    })
    expect(getLocalHtmlFileFromBrowserUrl('https://example.com/report.html')).toBeNull()
    expect(getLocalHtmlFileFromBrowserUrl('file:///tmp/report.md')).toBeNull()
  })
  it('converts file URLs without exposing non-file or malformed paths', () => {
    expect(browserFileUrlToAbsolutePath('file:///tmp/a%20b.html')).toBe('/tmp/a b.html')
    expect(browserFileUrlToAbsolutePath('https://example.com/a.html')).toBeNull()
    expect(browserFileUrlToAbsolutePath('file:///tmp/%E0%A4%A')).toBeNull()
  })
})
