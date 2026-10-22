export const ACCOUNT_IMPORT_RUNTIME_CAPABILITY = 'accounts.import-host-credentials.v1' as const
export const CLAUDE_SIGN_IN_RUNTIME_CAPABILITY = 'accounts.claude-sign-in.v1' as const
export const ANTIGRAVITY_ACCOUNTS_RUNTIME_CAPABILITY = 'accounts.antigravity-native.v1' as const
export const ANTIGRAVITY_CHAT_SIGN_IN_RUNTIME_CAPABILITY =
  'accounts.antigravity-chat-sign-in.v1' as const

export const ACCOUNT_RUNTIME_CAPABILITIES = [
  ACCOUNT_IMPORT_RUNTIME_CAPABILITY,
  CLAUDE_SIGN_IN_RUNTIME_CAPABILITY,
  ANTIGRAVITY_ACCOUNTS_RUNTIME_CAPABILITY,
  ANTIGRAVITY_CHAT_SIGN_IN_RUNTIME_CAPABILITY
] as const
