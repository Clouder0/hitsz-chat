import { type Context, Schema } from "koishi";
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

	ctx.on("message", async (session) => {
		const user_id = session.author.id;
		const prev = await ctx.database.get(db, user_id);
		console.log("prev", prev);

		let conversation_id = "";
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

		const set_task =
			conversation_id === ""
				? ctx.database.create(db, {
						id: user_id,
						last_time: new Date(now),
						conversation_id: res.conversation_id,
					})
				: ctx.database.set(db, user_id, {
						last_time: new Date(now),
						conversation_id: res.conversation_id,
					});
		console.log("set database", new Date(now), user_id, res.conversation_id);
		await Promise.all([send_task, set_task]);
		console.log("send done, res", res.answer);
	});
}
