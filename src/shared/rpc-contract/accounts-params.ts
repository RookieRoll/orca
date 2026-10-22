import { z } from 'zod'

export const ListAccountsParams = z.object({
  refreshUsage: z.boolean().default(true)
})

export const AccountsUnsubscribeParams = z.object({
  subscriptionId: z
    .unknown()
    .transform((value) => (typeof value === 'string' && value.length > 0 ? value : ''))
    .pipe(z.string().min(1, 'Missing subscriptionId'))
})
