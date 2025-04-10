import { describe, it, expect, vi, beforeAll } from "vitest";
import {TrafficStrategyAgent} from "../src/agents/traffic-strategy-agent";

describe("TrafficStrategyAgent", () => {
	let agent: TrafficStrategyAgent;

	beforeAll(() => {
		agent = new TrafficStrategyAgent({
			OPENAI_API_KEY: "test-key",
		});
	});

	it("should initialize correctly", () => {
		expect(agent).toBeInstanceOf(TrafficStrategyAgent);
	});

	describe("invoke()", () => {
		it("should format the prompt correctly", async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({
					choices: [{
						message: {
							content: "Test response"
						}
					}]
				}),
			});

			globalThis.fetch = mockFetch;

			await agent.invoke("test input");

			const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(requestBody.messages[0].content).toContain("test input");
			expect(requestBody.model).toBe("gpt-3.5-turbo");
		});

		it("should handle API errors", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
				statusText: "Unauthorized",
			});

			const result = await agent.invoke("test");
			expect(result).toBe("Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.");
		});

		it("should process a complete prompt and return a formatted strategy", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({
					choices: [{
						message: {
							content: `1. Estratégia detalhada:
								- Canais: Google Ads, Meta Ads
								- Público: Homens 25-40 anos
								- Orçamento: R$ 3.000/mês
								- KPIs: CTR > 1.5%

								2. Diagrama Mermaid:
								\`\`\`mermaid
								graph TD
									A[Campanha] --> B[Google Ads]
									A --> C[Meta Ads]
								\`\`\``
						}
					}]
				}),
			};

			globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

			const input = "Aumentar vendas de suplementos para homens";
			const result = await agent.invoke(input);

			expect(fetch).toHaveBeenCalledTimes(1);
			const [url, options] = vi.mocked(fetch).mock.calls[0];
			expect(url).toBe("https://api.openai.com/v1/chat/completions");

			const requestBody = JSON.parse(options.body.toString());
			expect(requestBody.messages[0].content).toContain(input);
			expect(requestBody.model).toBe("gpt-3.5-turbo");

			expect(result).toContain("1. Estratégia detalhada:");
			expect(result).toContain("2. Diagrama Mermaid:");
			expect(result).toContain("```mermaid");
		});
	});
});
