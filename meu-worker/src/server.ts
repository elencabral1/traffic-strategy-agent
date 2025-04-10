import { TrafficStrategyAgent, TrafficStrategyAgentEnv } from "./agents/traffic-strategy-agent";

interface Env extends TrafficStrategyAgentEnv {}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const agent = new TrafficStrategyAgent(env);
		const url = new URL(request.url);

		if (request.method === "POST") {
			try {
				const input = await request.text();
				const result = await agent.invoke(input);
				return new Response(result, {
					headers: { 'Content-Type': 'text/plain' }
				});
			} catch (error: any) {
				return new Response(`Error: ${error.message}`, {
					status: 500,
					headers: { 'Content-Type': 'text/plain' }
				});
			}
		}
		return new Response("Use POST method with your input in the body", {
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};
