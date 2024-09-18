import { type Context, Schema } from "koishi";
import { API } from "./api";

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
		hitsz_chat: {
			id: number;
			last_time: Date;
			conversation_id: string;
		};
	}
}
export function apply(ctx: Context) {
	const api = API(ctx.config.base_url, ctx.config.secret_key);

	ctx.model.extend("hitsz_chat", {
		id: "unsigned",
		last_time: "timestamp",
		conversation_id: "string",
	});

	ctx.on("message", async (session) => {
		const user_id = session.author.id;
		const prev = await ctx.database.get("hitsz_chat", user_id);
    console.log("prev", prev);

		let conversation_id = Math.random().toString(36).slice(-5);
		const now = Date.now();
		// 5 minutes refresh conversation session
		if (prev.length > 0 && prev[0].last_time > new Date(now - 1000 * 60 * 5)) {
			conversation_id = prev[0].conversation_id;
		}
    console.log("conversation_id", conversation_id);

		const res = await api.sendChatMsg(
			session.content,
			user_id,
			conversation_id,
		);
    console.log("res", res);
		const send_task = session.send(res.answer);

		const set_conv_task = ctx.database.set("hitsz_chat", user_id, {
			last_time: new Date(now),
			conversation_id: conversation_id,
		});
		await Promise.all([send_task, set_conv_task]);
    console.log("send done, res", res.answer)
	});
}
