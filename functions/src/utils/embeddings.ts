import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!openaiClient) {
		if (!apiKey) {
			// Defer throwing until a call is attempted inside cloud runtime
			// Returning a stub will cause functions below to throw controlled errors
			throw new Error('OPENAI_API_KEY is not set');
		}
		openaiClient = new OpenAI({ apiKey });
	}
	return openaiClient;
}

export async function generateEmbedding(text: string): Promise<number[]> {
	const input = (text || '').slice(0, 8000);
	const client = getOpenAI();
	const response = await client.embeddings.create({
		model: 'text-embedding-3-large',
		input,
	});
	const vector = response.data?.[0]?.embedding;
	if (!vector || !Array.isArray(vector)) {
		throw new Error('Failed to generate embedding');
	}
	return vector as number[];
}

export async function extractSkillsWithLLM(text: string): Promise<string[]> {
	if (!text) return [];
	try {
		const client = getOpenAI();
		const sys = 'You are an expert HR assistant. Extract up to 12 concise technical or domain skills from the text. Return ONLY a JSON array of strings. No commentary.';
		const prompt = `Text:\n${text}\n\nReturn JSON array:`;
		const res = await client.chat.completions.create({
			model: 'gpt-5.1',
			messages: [
				{ role: 'system', content: sys },
				{ role: 'user', content: prompt },
			],
			temperature: 0.2,
			reasoning_effort: 'low', // GPT-5.1 feature - low effort for quick skill extraction
		});
		const content = res.choices?.[0]?.message?.content || '[]';
		const jsonStart = content.indexOf('[');
		const jsonEnd = content.lastIndexOf(']');
		const json = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : '[]';
		const parsed = JSON.parse(json);
		if (Array.isArray(parsed)) {
			return parsed
				.map((s) => String(s).trim())
				.filter(Boolean)
				.slice(0, 12);
		}
		return [];
	} catch {
		return [];
	}
}


