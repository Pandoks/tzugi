import { describe, expect, test } from 'vitest';
import { extractJSONTextFromLLMResponse, paginationTextGenerator } from './utils';

describe('Pagination text generation', () => {
	test('Less than pagination navigation length (7)', () => {
		expect(paginationTextGenerator({ pageIndex: 0, pageCount: 1 })).toStrictEqual(['current']);
		expect(paginationTextGenerator({ pageIndex: 0, pageCount: 2 })).toStrictEqual(['current', '2']);
		expect(paginationTextGenerator({ pageIndex: 1, pageCount: 2 })).toStrictEqual(['1', 'current']);
		expect(paginationTextGenerator({ pageIndex: 4, pageCount: 6 })).toStrictEqual([
			'1',
			'2',
			'3',
			'4',
			'current',
			'6'
		]);
		expect(paginationTextGenerator({ pageIndex: 4, pageCount: 7 })).toStrictEqual([
			'1',
			'2',
			'3',
			'4',
			'current',
			'6',
			'7'
		]);
	});

	test('Pagination of size 8', () => {
		expect(paginationTextGenerator({ pageIndex: 0, pageCount: 8 })).toStrictEqual([
			'current',
			'2',
			'3',
			'4',
			'5',
			'...',
			'8'
		]);
		expect(paginationTextGenerator({ pageIndex: 2, pageCount: 8 })).toStrictEqual([
			'1',
			'2',
			'current',
			'4',
			'5',
			'...',
			'8'
		]);
		expect(paginationTextGenerator({ pageIndex: 3, pageCount: 8 })).toStrictEqual([
			'1',
			'2',
			'3',
			'current',
			'5',
			'...',
			'8'
		]);
		expect(paginationTextGenerator({ pageIndex: 4, pageCount: 8 })).toStrictEqual([
			'1',
			'...',
			'4',
			'current',
			'6',
			'7',
			'8'
		]);
		expect(paginationTextGenerator({ pageIndex: 5, pageCount: 8 })).toStrictEqual([
			'1',
			'...',
			'4',
			'5',
			'current',
			'7',
			'8'
		]);
		expect(paginationTextGenerator({ pageIndex: 7, pageCount: 8 })).toStrictEqual([
			'1',
			'...',
			'4',
			'5',
			'6',
			'7',
			'current'
		]);
	});

	test('Pagination of size 20', () => {
		expect(paginationTextGenerator({ pageIndex: 0, pageCount: 20 })).toStrictEqual([
			'current',
			'2',
			'3',
			'4',
			'5',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 2, pageCount: 20 })).toStrictEqual([
			'1',
			'2',
			'current',
			'4',
			'5',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 3, pageCount: 20 })).toStrictEqual([
			'1',
			'2',
			'3',
			'current',
			'5',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 4, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'4',
			'current',
			'6',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 9, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'9',
			'current',
			'11',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 15, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'15',
			'current',
			'17',
			'...',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 16, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'16',
			'current',
			'18',
			'19',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 17, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'16',
			'17',
			'current',
			'19',
			'20'
		]);
		expect(paginationTextGenerator({ pageIndex: 19, pageCount: 20 })).toStrictEqual([
			'1',
			'...',
			'16',
			'17',
			'18',
			'19',
			'current'
		]);
	});
});

describe('Extracting JSON from LLM responses', () => {
	test('No JSON included', () => {
		const noJSON =
			'Culpa occaecat ipsum minim enim labore mollit est ipsum elit irure nisi sint. Voluptate esse eu excepteur voluptate amet proident ex est esse reprehenderit pariatur consectetur quis aliquip dolore. Dolor anim laboris enim excepteur. Officia officia ea Lorem est dolore nulla.';
		expect(() => extractJSONTextFromLLMResponse(noJSON)).toThrowError("Can't extract json");
	});

	test('Malformed JSON', () => {
		const malformedJSON = `
Here is your malformed JSON:
\`\`\`json
{ "total": "100", 
\`\`\``;
		expect(() => extractJSONTextFromLLMResponse(malformedJSON)).toThrowError("Can't extract json");
	});

	test('Example LLM response', () => {
		const llmResponse = `
Based on the provided text which is in JSON format, only the \`total\` field is present with a value of an empty string (""). Therefore, I will also provide the other fields as empty strings since they are not mentioned in the given text. Here's the final JSON object:

\`\`\`json
{
  "total": "",
  "date": "",
  "channel": "",
  "merchant": "",
  "card": ""
}
\`\`\`

Explanation of each field:

1. total: The value is extracted from the provided text, which contains only the \`total\` field with an empty string. Hence, I used an empty string for this field.
2. date: Not given in the provided text, so it remains as an empty string.
3. channel: Not given in the provided text, so it remains as an empty string.
4. merchant: Not given in the provided text, so it remains as an empty string.
5. card: Not given in the provided text, so it remains as an empty string.'`;
		expect(JSON.parse(extractJSONTextFromLLMResponse(llmResponse))).toStrictEqual({
			total: '',
			date: '',
			channel: '',
			merchant: '',
			card: ''
		});
	});
});

describe('Extracting JSON from LLM responses (formatted with js)', () => {
	test('No JSON included', () => {
		const noJSON =
			'Culpa occaecat ipsum minim enim labore mollit est ipsum elit irure nisi sint. Voluptate esse eu excepteur voluptate amet proident ex est esse reprehenderit pariatur consectetur quis aliquip dolore. Dolor anim laboris enim excepteur. Officia officia ea Lorem est dolore nulla.';
		expect(() => extractJSONTextFromLLMResponse(noJSON)).toThrowError("Can't extract json");
	});

	test('Malformed JSON', () => {
		const malformedJSON = `
Here is your malformed JSON:
\`\`\`js
{ "total": "100", 
\`\`\``;
		expect(() => extractJSONTextFromLLMResponse(malformedJSON)).toThrowError("Can't extract json");
	});

	test('Example LLM response', () => {
		const llmResponse = `
Based on the provided text which is in JSON format, only the \`total\` field is present with a value of an empty string (""). Therefore, I will also provide the other fields as empty strings since they are not mentioned in the given text. Here's the final JSON object:

\`\`\`js
{
  "total": "",
  "date": "",
  "channel": "",
  "merchant": "",
  "card": ""
}
\`\`\`

Explanation of each field:

1. total: The value is extracted from the provided text, which contains only the \`total\` field with an empty string. Hence, I used an empty string for this field.
2. date: Not given in the provided text, so it remains as an empty string.
3. channel: Not given in the provided text, so it remains as an empty string.
4. merchant: Not given in the provided text, so it remains as an empty string.
5. card: Not given in the provided text, so it remains as an empty string.'`;
		expect(JSON.parse(extractJSONTextFromLLMResponse(llmResponse))).toStrictEqual({
			total: '',
			date: '',
			channel: '',
			merchant: '',
			card: ''
		});
	});
});
