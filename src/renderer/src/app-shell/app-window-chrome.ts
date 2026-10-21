import { shouldRenderDesktopWindowChrome } from '@/lib/desktop-window-chrome'

export const isMac = navigator.userAgent.includes('Mac')
const isWindows = !isMac && navigator.userAgent.includes('Windows')
export const shortcutPlatform: NodeJS.Platform = isMac ? 'darwin' : isWindows ? 'win32' : 'linux'
// Why: Windows and Linux remove the native title bar so the renderer draws its own chrome.
export const hasCustomTitleBar = shouldRenderDesktopWindowChrome({ platform: shortcutPlatform })

// Why: the three 46px window-control buttons and the 36px titlebar they sit in.
// Surfaces offset by these instead of hardcoding the pixels.
export const WINDOW_CONTROLS_WIDTH = hasCustomTitleBar ? '138px' : '0px'
export const WINDOW_CONTROLS_HEIGHT = hasCustomTitleBar ? '36px' : '0px'

// Why: macOS paints traffic lights on the window's top-left edge.
export const hasMacTrafficLights = isMac
export const MAC_TRAFFIC_LIGHTS_WIDTH = hasMacTrafficLights ? '80px' : '0px'
