import { Agent, Connection, ConnectionContext, WSMessage } from "agents";

export interface TrafficStrategyAgentEnv {
	AI: Ai;
}

export class TrafficStrategyAgent extends Agent<{}> {
	async invoke(input: string) {
		const prompt = `
Você é um especialista em tráfego pago. Gere uma estratégia completa de mídia paga para o seguinte objetivo:

"${input}"

A estratégia deve conter:
- Canais (Facebook Ads, Google Ads, etc)
- Segmentação de público
- Orçamento estimado
- Cronograma
- KPIs
- Diagrama em formato Mermaid

Formato da resposta:
1. Estratégia detalhada em texto
2. Diagrama Mermaid (bloco separado)
`;

		const result = await this.env.AI.run("@cf/meta/llama-3-8b-instruct", { prompt });

		return {
			role: "assistant",
			content: result.response
		};
	}

	async onConnect(connection: Connection, ctx: ConnectionContext) {
		console.log("✅ WebSocket conectado!");
	}

	async onMessage(connection: Connection<unknown>, message: WSMessage) {
		console.log("📩 Mensagem recebida:", message);

		const result = await this.invoke(message.toString());
		await connection.send(result.content);
	}
}
