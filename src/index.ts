import { type Context, Schema, Session } from "koishi";
import { API } from "./api";
import { v4 as uuidv4 } from "uuid";

export const name = "hitsz-chat";
export const inject = {
	required: ["database"],
};

export type Config = {
	secret_key: string;
	base_url: string;
};

export const Config: Schema<Config> = Schema.object({
	secret_key: Schema.string().required(),
	base_url: Schema.string().required(),
});

declare module "koishi" {
	interface Tables {
		hitsz_chat_v2: {
			id: string;
			last_time: Date;
			conversation_id: string;
		};
	}
}
const db = "hitsz_chat_v2";
export function apply(ctx: Context) {
	const api = API(ctx.config.base_url, ctx.config.secret_key);

	ctx.model.extend(db, {
		id: "string",
		last_time: "timestamp",
		conversation_id: "string",
	});
  
  const handleChat = async(conversation_id: string, user_id: string, query: string) => {
		try {
			const res = await api.sendChatMsg(
				query,
				user_id,
				conversation_id,
			);

			await ctx.database.upsert(db, (_) => [
				{
					id: user_id,
					last_time: new Date(),
					conversation_id: res.conversation_id,
				},
			]);
      return res.answer;
		} catch (e) {
			console.error(e);
			return "抱歉，出现了未知错误！";
		}
  }

	ctx
		.command("chat.end", "终止本轮对话")
		.usage("停止本轮对话，终止当前 Session，重新开始一个新的话题。")
		.action(async (options) => {
			const user_id = options.session.author.id;
			await ctx.database.remove(db, user_id);
			options.session.send("已终止本轮对话。");
		});

  ctx.command("ask <msg:text>").action(async(a) => {
    // always start a new conversation
    const res = await handleChat("", a.session.author.id, a.args[0]);
    await a.session.send("我已经收到了你的消息，请耐心等待...");
    await a.session.send(res);
  })
  
  ctx.middleware(async (session, next) => {
    const user_id = session.author.id;
		const prev = await ctx.database.get(db, user_id);
    let conversation_id = "";
		const now = Date.now();
		// 5 minutes refresh conversation session
		if (prev.length > 0 && prev[0].last_time > new Date(now - 1000 * 60 * 5)) {
			conversation_id = prev[0].conversation_id;
		}
    if(conversation_id === "") {
      // in this mode only handles session msg
      next();
    }
    await session.send("我已经收到了你的消息，请耐心等待...");
    const res = await handleChat(conversation_id, user_id, session.content);
    await session.send(res);
   
  })
}
