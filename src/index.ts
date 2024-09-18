import { type Context, Schema } from 'koishi'

export const name = 'hitsz-chat'

export type Config = {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // write your plugin here
}
