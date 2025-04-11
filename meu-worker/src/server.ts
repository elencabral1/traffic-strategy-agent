import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { TrafficStrategyAgent, TrafficStrategyAgentEnv } from "./agents/traffic-strategy-agent";

type Bindings = TrafficStrategyAgentEnv;

const app = new Hono<{ Bindings: Bindings }>();

app.post("/", async (c) => {
	const input = await c.req.text();
	const agent = new TrafficStrategyAgent(c.env);

	try {
		const result = await agent.invoke(input);
		return c.text(result);
	} catch (error: any) {
		return c.text(`Error: ${error.message}`, 500);
	}
});

app.get("/ws", upgradeWebSocket((c) => {
	const agent = new TrafficStrategyAgent(c.env);

	return {
		onOpen(ws: any) {
			console.log("🔌 Conexão WebSocket iniciada");

			const connection = {
				send: (data: string) => ws.send(data),
				close: () => ws.close(),
			};

			const ctx = {};
			agent.onConnect(connection as any, ctx as any);
		},
		onMessage(ws, message) {
			console.log("Mensagem recebida via WS:", message);

			const connection = {
				send: (data: string) => ws.send(data),
				close: () => ws.close(),
			};

			const fakeMsg = { toString: () => message };
			agent.onMessage(connection as any, fakeMsg as any);
		},
		onClose() {
			console.log("Conexão WebSocket fechada");
		},
		onError(ws, err) {
			console.error("Erro no WebSocket:", err);
		},
	};
}));

app.get("/", (c) => c.text("API ativa. Use POST / ou conecte via WS em /ws"));

export default app;
