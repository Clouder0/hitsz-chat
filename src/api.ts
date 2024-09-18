import { DifyClient, ChatClient, CompletionClient } from "dify-client";

export type ChatCompletionResponse = {
	message_id: string;
	conversation_id: string;
	mode: "chat";
	answer: string;
	metadata: {
		usage: {
			prompt_tokens: number;
			prompt_unit_price: string;
			prompt_price_unit: string;
			prompt_price: string;
			completion_tokens: number;
			completion_unit_price: string;
			completion_price_unit: string;
			completion_price: string;
			total_tokens: number;
			total_price: string;
			currency: string;
			latency: number;
		};
		retriever_resources: unknown[];
	};
	created_at: number;
};

const example_response = {
	event: "message",
	message_id: "9da23599-e713-473b-982c-4328d4f5c78a",
	conversation_id: "45701982-8118-4bc5-8e9b-64562b4555f2",
	mode: "chat",
	answer: "iPhone 13 Pro Max specs are listed here:...",
	metadata: {
		usage: {
			prompt_tokens: 1033,
			prompt_unit_price: "0.001",
			prompt_price_unit: "0.001",
			prompt_price: "0.0010330",
			completion_tokens: 128,
			completion_unit_price: "0.002",
			completion_price_unit: "0.001",
			completion_price: "0.0002560",
			total_tokens: 1161,
			total_price: "0.0012890",
			currency: "USD",
			latency: 0.7682376249867957,
		},
		retriever_resources: [
			{
				position: 1,
				dataset_id: "101b4c97-fc2e-463c-90b1-5261a4cdcafb",
				dataset_name: "iPhone",
				document_id: "8dd1ad74-0b5f-4175-b735-7d98bbbb4e00",
				document_name: "iPhone List",
				segment_id: "ed599c7f-2766-4294-9d1d-e5235a61270a",
				score: 0.98457545,
				content:
					'"Model","Release Date","Display Size","Resolution","Processor","RAM","Storage","Camera","Battery","Operating System"\n"iPhone 13 Pro Max","September 24, 2021","6.7 inch","1284 x 2778","Hexa-core (2x3.23 GHz Avalanche + 4x1.82 GHz Blizzard)","6 GB","128, 256, 512 GB, 1TB","12 MP","4352 mAh","iOS 15"',
			},
		],
	},
	created_at: 1705407629,
};

export const API = (base_url: string, key: string) => {
	const sendChatMsg = async (
		query: string,
		user: string,
		conversation_id: string,
	) => {
		const res = await fetch(`${base_url}/chat-messages`, {
			headers: {
				"Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify({
				query,
				user,
				conversation_id,
				response_mode: "blocking",
				inputs: {},
				files: [],
			}),
		});
		return (await res.json()) as ChatCompletionResponse;
	};

	const messageFeedback = async (
		message_id: string,
		user: string,
		rating: "like" | "dislike" | "null",
	) => {
		await fetch(`${base_url}/messages/${message_id}/feedbacks`, {
			headers: {
				"Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify({
				rating,
				user,
			}),
		});
	};

	return { sendChatMsg };
};
