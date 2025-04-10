import { TrafficStrategyAgent, TrafficStrategyAgentEnv } from "./agents/traffic-strategy-agent";

interface Env extends TrafficStrategyAgentEnv {
	MY_DURABLE_OBJECT: DurableObjectNamespace;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const agent = new TrafficStrategyAgent(env);

		if (request.headers.get("Upgrade") === "websocket") {
			const [client, server] = Object.values(new WebSocketPair());
			await agent.handleWebSocket(server);

			return new Response(null, {
				status: 101,
				webSocket: client,
			});
		}

		// Lidar com requisição HTTP normal
		const input = await request.text();
		const result = await agent.invoke(input);

		return new Response(JSON.stringify(result), {
			headers: { "Content-Type": "application/json" }
		});
	}
};
