import { Connection, ConnectionContext, WSMessage } from "agents";

export interface TrafficStrategyAgentEnv {
	OPENAI_API_KEY: string;
}

export class TrafficStrategyAgent {
	constructor(private env: TrafficStrategyAgentEnv) {}
	async invoke(input: string) {
		if (!this.env.OPENAI_API_KEY) {
			throw new Error("OpenAI API key não configurada no ambiente");
		}
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

		try {
			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.env.OPENAI_API_KEY}`,
				},
				body: JSON.stringify({
					model: "gpt-3.5-turbo",
					messages: [{ role: "user", content: prompt }],
					temperature: 0.7,
				}),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status} ${response.statusText}`);
			}

			const data: any = await response.json();

			if (!data?.choices?.[0]?.message?.content) {
				console.error("Resposta inesperada da OpenAI:", data);
				throw new Error("Resposta da API em formato inesperado");
			}

			return data.choices[0].message.content;
		} catch (error) {
			console.error("Erro ao chamar OpenAI:", error);
			return "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.";
		}
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
