import { Loader2, RotateCcw } from 'lucide-react'
import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { translate } from '@/i18n/i18n'
import { defaultScopeHost } from '@/lib/default-creation-host'
import { runtimeTargetEnvironmentId } from '@/runtime/runtime-client-target'
import { useActiveAccountOwner } from '@/runtime/use-worktree-runtime-target'
import { useAppStore } from '../../store'
import type { ProviderRateLimits } from '../../../../shared/rate-limit-types'
import { STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS } from './status-bar-context-menu-policy'
import { getCodexResetProjection } from './codex-switcher-projection'

export function CodexResetCreditAction({ codex }: { codex: ProviderRateLimits }): React.JSX.Element | null {
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const consumeResetCredit = useAppStore((state) => state.consumeCodexRateLimitResetCredit)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [skipFutureConfirm, setSkipFutureConfirm] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const mountedRef = useRef(true)
  const { target } = useActiveAccountOwner(defaultScopeHost(settings))
  const hasActiveRuntimeEnvironment = runtimeTargetEnvironmentId(target) !== null
  const { canRedeemReset, resetCreditCount, resetCreditExpiry } = getCodexResetProjection(
    codex,
    hasActiveRuntimeEnvironment
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  if (resetCreditCount === null) {
    return null
  }

  const redeem = async (): Promise<void> => {
    if (isRedeeming) {
      return
    }
    setIsRedeeming(true)
    try {
      await consumeResetCredit()
    } catch (error) {
      console.error('Failed to redeem Codex rate-limit reset from status bar:', error)
    } finally {
      if (mountedRef.current) {
        setIsRedeeming(false)
      }
    }
  }

  const requestReset = (): void => {
    if (settings?.skipCodexRateLimitResetConfirm) {
      void redeem()
      return
    }
    setSkipFutureConfirm(false)
    setConfirmOpen(true)
  }

  const confirmReset = async (): Promise<void> => {
    if (isRedeeming) {
      return
    }
    if (skipFutureConfirm) {
      try {
        await updateSettings({ skipCodexRateLimitResetConfirm: true })
      } catch (error) {
        console.error('Failed to save Codex reset confirmation preference:', error)
      }
    }
    await redeem()
    if (mountedRef.current) {
      setConfirmOpen(false)
      setSkipFutureConfirm(false)
    }
  }

  return (
    <>
      <DropdownMenuLabel className="space-y-0.5">
        <div>
          {resetCreditCount === 1
            ? translate('auto.components.status.bar.StatusBar.5e5f9f5160', '1 rate-limit reset available')
            : translate(
                'auto.components.status.bar.StatusBar.5ecae9197c',
                '{{value0}} rate-limit resets available',
                { value0: resetCreditCount }
              )}
        </div>
        {resetCreditExpiry ? (
          <div className="text-[11px] font-normal text-muted-foreground">{resetCreditExpiry}</div>
        ) : null}
      </DropdownMenuLabel>
      {canRedeemReset ? (
        <DropdownMenuItem
          disabled={isRedeeming}
          onSelect={(event) => {
            event.preventDefault()
            requestReset()
          }}
        >
          {isRedeeming ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : null}
          {isRedeeming
            ? translate('auto.components.status.bar.StatusBar.25d8bbde69', 'Using reset…')
            : translate('auto.components.status.bar.StatusBar.e159fc1fd7', 'Reset now')}
        </DropdownMenuItem>
      ) : null}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]" {...STATUS_BAR_CONTEXT_MENU_EXEMPT_PROPS}>
          <DialogHeader>
            <DialogTitle>
              {translate('auto.components.status.bar.StatusBar.972a1ff497', 'Reset Codex limits?')}
            </DialogTitle>
            <DialogDescription>
              {translate(
                'auto.components.status.bar.StatusBar.6d1042aa6f',
                'This uses one Codex rate-limit reset credit for the active account and resets any eligible usage windows immediately.'
              )}
            </DialogDescription>
          </DialogHeader>
          <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-xs text-foreground/80 transition-colors hover:text-foreground">
            <Checkbox
              checked={skipFutureConfirm}
              onCheckedChange={(checked) => setSkipFutureConfirm(checked === true)}
            />
            <span>
              {translate('auto.components.status.bar.StatusBar.f077f586db', "Don't ask again")}
            </span>
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {translate('auto.components.status.bar.StatusBar.c0e972d726', 'Cancel')}
            </Button>
            <Button onClick={() => void confirmReset()} disabled={isRedeeming}>
              {isRedeeming ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              {isRedeeming
                ? translate('auto.components.status.bar.StatusBar.25d8bbde69', 'Using reset…')
                : translate('auto.components.status.bar.StatusBar.e159fc1fd7', 'Reset now')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
