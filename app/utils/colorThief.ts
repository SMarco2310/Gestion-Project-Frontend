import { getPaletteSync } from 'colorthief'

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.min(255, Math.max(0, Math.round(x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * Converts any image source (URL, File, or Blob) into a Data URL string.
 * This guarantees canvas operations won't throw tainted CORS SecurityErrors.
 */
async function toDataUrl(imageSrc: string | File): Promise<string> {
  if (typeof imageSrc !== 'string') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(imageSrc)
    })
  }

  if (imageSrc.startsWith('data:')) {
    return imageSrc
  }

  // Convert backend localhost:8000 URL to relative /storage/ URL so Nuxt proxy serves it same-origin
  let fetchUrl = imageSrc
  if (fetchUrl.includes(':8000/storage/')) {
    fetchUrl = fetchUrl.replace(/http:\/\/localhost:8000\/storage\//, '/storage/')
  }

  try {
    const response = await fetch(fetchUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.warn('toDataUrl fetch warning, using direct URL:', fetchUrl, e)
    return imageSrc
  }
}

export async function getPaletteFromImage(imageSrc: string | File, colorCount: number = 6): Promise<string[]> {
  try {
    const dataUrl = await toDataUrl(imageSrc)
    
    return await new Promise<string[]>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'

      img.onload = () => {
        // 1. Try ColorThief getPaletteSync
        try {
          const palette = getPaletteSync(img, { colorCount })
          if (palette && palette.length > 0) {
            const hexPalette: string[] = []
            for (const c of palette) {
              if (typeof (c as any).hex === 'function') {
                hexPalette.push((c as any).hex())
              } else if ((c as any).srgb) {
                const [r, g, b] = (c as any).srgb
                hexPalette.push(rgbToHex(r, g, b))
              } else if (Array.isArray(c)) {
                hexPalette.push(rgbToHex(c[0], c[1], c[2]))
              }
            }
            const uniqueHex = Array.from(new Set(hexPalette))
            if (uniqueHex.length > 0) {
              resolve(uniqueHex.slice(0, colorCount))
              return
            }
          }
        } catch (err) {
          console.warn('ColorThief getPaletteSync error, using canvas fallback:', err)
        }

        // 2. Custom Canvas Extraction fallback
        resolve(extractCanvasPalette(img, colorCount))
      }

      img.onerror = () => {
        resolve(extractCanvasPalette(img, colorCount))
      }

      img.src = dataUrl
    })
  } catch (err) {
    console.error('getPaletteFromImage error:', err)
    return []
  }
}

function extractCanvasPalette(img: HTMLImageElement, colorCount: number): string[] {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return []

    const maxDim = 120
    let w = img.naturalWidth || img.width || 100
    let h = img.naturalHeight || img.height || 100
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w)
        w = maxDim
      } else {
        w = Math.round((w * maxDim) / h)
        h = maxDim
      }
    }

    canvas.width = w
    canvas.height = h
    ctx.drawImage(img, 0, 0, w, h)
    const imgData = ctx.getImageData(0, 0, w, h).data

    const colorCounts: { [key: string]: { r: number, g: number, b: number, count: number } } = {}

    for (let i = 0; i < imgData.length; i += 4) {
      const a = imgData[i + 3] ?? 0
      if (a < 30) continue // Skip transparent pixels

      const r = imgData[i] ?? 0
      const g = imgData[i + 1] ?? 0
      const b = imgData[i + 2] ?? 0

      // Quantize to steps of 16 for color grouping
      const qr = Math.min(255, Math.round(r / 16) * 16)
      const qg = Math.min(255, Math.round(g / 16) * 16)
      const qb = Math.min(255, Math.round(b / 16) * 16)

      const key = `${qr},${qg},${qb}`
      if (!colorCounts[key]) {
        colorCounts[key] = { r: qr, g: qg, b: qb, count: 0 }
      }
      colorCounts[key].count++
    }

    const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count)

    if (sorted.length > 0) {
      const hexList = sorted.map(c => rgbToHex(c.r, c.g, c.b))
      const uniqueHex = Array.from(new Set(hexList))
      return uniqueHex.slice(0, colorCount)
    }
  } catch (err) {
    console.warn('Canvas palette extraction failed:', err)
  }

  return []
}
