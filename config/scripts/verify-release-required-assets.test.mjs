import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getRequiredReleaseAssetNames,
  verifyRequiredReleaseAssets
} from './verify-release-required-assets.mjs'

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn(async () => body)
  }
}

function releaseWithAssets(tag, assetNames) {
  return {
    tag_name: tag,
    draft: true,
    prerelease: false,
    assets: assetNames.map((name, index) => ({
      id: index + 1,
      name,
      state: 'uploaded',
      size: 123
    }))
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getRequiredReleaseAssetNames', () => {
  it('requires every manually distributed installer for the tagged version', () => {
    expect(getRequiredReleaseAssetNames('v1.4.27')).toEqual([
      'orca-linux.AppImage',
      'orca-linux-arm64.AppImage',
      'orca-ide_1.4.27_amd64.deb',
      'orca-ide_1.4.27_arm64.deb',
      'orca-ide-1.4.27.x86_64.rpm',
      'orca-ide-1.4.27.aarch64.rpm',
      'orca-windows-setup.exe',
      'Orca-1.4.27-mac.zip',
      'Orca-1.4.27-arm64-mac.zip',
      'orca-macos-x64.dmg',
      'orca-macos-arm64.dmg'
    ])
  })
})

describe('verifyRequiredReleaseAssets', () => {
  it('checks installer assets without fetching updater metadata', async () => {
    const tag = 'v1.4.27'
    const required = getRequiredReleaseAssetNames(tag)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([releaseWithAssets(tag, required)]))
    vi.stubGlobal('fetch', fetchMock)

    const result = await verifyRequiredReleaseAssets({ repo: 'stablyai/orca', tag, token: 'token' })

    expect(result.checked).toEqual(required.slice().sort())
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/stablyai/orca/releases?per_page=100'
    )
  })

  it('rejects a release while a required installer is missing', async () => {
    const tag = 'v1.4.27'
    const required = getRequiredReleaseAssetNames(tag)
    const assets = required.filter((name) => name !== 'orca-windows-setup.exe')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([releaseWithAssets(tag, assets)])))

    await expect(
      verifyRequiredReleaseAssets({ repo: 'stablyai/orca', tag, token: 'token' })
    ).rejects.toThrow('Missing: orca-windows-setup.exe')
  })

  it('rejects empty or unfinished installer uploads', async () => {
    const tag = 'v1.4.27'
    const assets = releaseWithAssets(tag, getRequiredReleaseAssetNames(tag))
    assets.assets.find((asset) => asset.name === 'orca-linux.AppImage').size = 0
    assets.assets.find((asset) => asset.name === 'orca-windows-setup.exe').state = 'new'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([assets])))

    await expect(
      verifyRequiredReleaseAssets({ repo: 'stablyai/orca', tag, token: 'token' })
    ).rejects.toThrow('Not uploaded: orca-windows-setup.exe:new\nEmpty: orca-linux.AppImage')
  })
})
