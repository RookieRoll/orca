import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'

export type StatusBarDensity = {
  /** Hide secondary status-segment labels. */
  compact: boolean
  /** Keep status segments to icons when the bar is too narrow for labels. */
  segmentsIconOnly: boolean
}

export const STATUS_BAR_DENSITY_LEVELS: readonly StatusBarDensity[] = [
  { compact: false, segmentsIconOnly: false },
  { compact: true, segmentsIconOnly: false },
  { compact: true, segmentsIconOnly: true }
]

export type StatusBarLevelWidth = {
  natural: number
}

const WIDTH_TOLERANCE_PX = 1

export function pickStatusBarDensityLevel(
  levelWidths: readonly (StatusBarLevelWidth | undefined)[],
  availableWidth: number
): number {
  const tightest = STATUS_BAR_DENSITY_LEVELS.length - 1
  for (let level = 0; level < tightest; level++) {
    const width = levelWidths[level]
    if (width === undefined || width.natural <= availableWidth + WIDTH_TOLERANCE_PX) {
      return level
    }
  }
  return tightest
}

export function recordStatusBarDensityWidth(
  levelWidths: readonly (StatusBarLevelWidth | undefined)[],
  level: number,
  width: StatusBarLevelWidth
): (StatusBarLevelWidth | undefined)[] {
  const previous = levelWidths[level]
  const changed = previous !== undefined && Math.abs(previous.natural - width.natural) > WIDTH_TOLERANCE_PX
  const next = changed ? [] : [...levelWidths]
  next[level] = width
  return next
}

type ElementRef = MutableRefObject<HTMLElement | null>

function measureWidth(ref: ElementRef): number {
  return ref.current?.getBoundingClientRect().width ?? 0
}

/** Picks the roomiest segment layout that fits on one line. */
export function useStatusBarDensity(): {
  density: StatusBarDensity
  overflowing: boolean
  barRef: (node: HTMLElement | null) => void
  segmentsRef: (node: HTMLElement | null) => void
} {
  const [level, setLevel] = useState(0)
  const [overflowing, setOverflowing] = useState(false)
  const committedLevelRef = useRef(0)
  const overflowingRef = useRef(false)
  const levelWidthsRef = useRef<(StatusBarLevelWidth | undefined)[]>([])
  const barElementRef = useRef<HTMLElement | null>(null)
  const segmentsElementRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  const evaluate = useCallback((): void => {
    const bar = barElementRef.current
    if (!bar) {
      return
    }
    const style = getComputedStyle(bar)
    const available =
      bar.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight)
    const required =
      (Number.parseFloat(style.columnGap) || 0) + measureWidth(segmentsElementRef)
    levelWidthsRef.current = recordStatusBarDensityWidth(
      levelWidthsRef.current,
      committedLevelRef.current,
      { natural: required }
    )
    const nextLevel = pickStatusBarDensityLevel(levelWidthsRef.current, available)
    if (nextLevel !== committedLevelRef.current) {
      setLevel(nextLevel)
    }
    const nextOverflowing = required > available + WIDTH_TOLERANCE_PX
    if (nextOverflowing !== overflowingRef.current) {
      overflowingRef.current = nextOverflowing
      setOverflowing(nextOverflowing)
    }
  }, [])

  useLayoutEffect(() => {
    committedLevelRef.current = level
    evaluate()
  })

  useEffect(() => () => observerRef.current?.disconnect(), [])

  const refs = useMemo(() => {
    const bind =
      (target: ElementRef) =>
      (node: HTMLElement | null): void => {
        observerRef.current ??= new ResizeObserver(() => evaluate())
        if (target.current) {
          observerRef.current.unobserve(target.current)
        }
        target.current = node
        if (node) {
          observerRef.current.observe(node)
        }
      }
    return {
      barRef: bind(barElementRef),
      segmentsRef: bind(segmentsElementRef)
    }
  }, [evaluate])

  return { density: STATUS_BAR_DENSITY_LEVELS[level], overflowing, ...refs }
}
