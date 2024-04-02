import { describe, expect, test } from 'vitest';
import { ollama } from './ollama';
import { extractJSONTextFromLLMResponse } from '$lib/utils';
import levenshtein from 'fast-levenshtein';

describe('LLM prompt', () => {
	const generatePrompt = (data: string) => {
		return `
This is some text that is extracted from a transaction receipt: \`${data}\`

Respond in only JSON format and nothing else.

This is the JSON format and description of each field:
\`\`\`js
{
total: // The total that the person paid for the transaction. If there is no total, it should be "" and nothing else.
date: // The date of the transaction. Format: YYYY-MM-DD. If there is no date, it should be "" and nothing else. If there is no time it should be YYYY-MM-DD ().
merchant: // The merchant the person paid. If there is no merchant, it should be "" and nothing else.
card: // The last 4 or 5 digits of the card that the paying person used. Do not include "*" or other symbols, but usually the card number is included with a bunch of "*" in front of it (ie. ************xxxx). If there is not card digits, it should be "" and nothing else.
}
\`\`\`
DO NOT assume or infer anything about the given data.
Make sure to include these fields in your JSON response: \`{total: , date: , merchant: , card: }\` even if some or all of the fields are empty.
Format it with \`json\` markdown.

Give an explanation on how you got to the answer for each field.
`;
	};

	// 99% passing rate
	test('Missing data (json input)', { timeout: 1000000 }, async () => {
		const prompt = generatePrompt(JSON.stringify({ total: '' }));
		const {
			message: { content }
		} = await ollama({ model: 'mistral', prompt: prompt });
		const extractedJSON = extractJSONTextFromLLMResponse(content);
		expect(JSON.parse(extractedJSON)).toStrictEqual({
			total: '',
			date: '',
			merchant: '',
			card: ''
		});
	});

	// 95% passing rate
	test('Some null in data (json input)', { timeout: 1000000 }, async () => {
		const prompt = generatePrompt(
			JSON.stringify({ total: 12.34, date: '', merchant: 'Uber Eats', card: '1234' })
		);
		const {
			message: { content }
		} = await ollama({ model: 'mistral', prompt: prompt });
		const extractedJSON = extractJSONTextFromLLMResponse(content);
		expect(JSON.parse(extractedJSON)).toStrictEqual({
			total: '12.34',
			date: '',
			merchant: 'Uber Eats',
			card: '1234'
		});
	});

	// 90% passing rate
	test('Missing data (natural input)', { timeout: 1000000 }, async () => {
		const prompt = generatePrompt(
			'Aute fugiat voluptate consectetur ea consectetur. Minim enim in qui id reprehenderit nulla tempor magna mollit. Ad anim enim magna sit magna adipisicing eu nulla magna nostrud excepteur labore reprehenderit. Duis consectetur nisi tempor aliquip nostrud. Anim do laboris irure veniam. Duis Lorem do quis voluptate.'
		);
		const {
			message: { content }
		} = await ollama({ model: 'mistral', prompt: prompt });
		const extractedJSON = extractJSONTextFromLLMResponse(content);
		// console.log(content);
		expect(JSON.parse(extractedJSON)).toStrictEqual({
			total: '',
			date: '',
			merchant: '',
			card: ''
		});
	});

	test('Some null in data (natural input)', { timeout: 1000000 }, async () => {
		const prompt = generatePrompt(`Michael's
Made by you
MICHAELS STORE #9010 (386) 767-7495
MICHAELS STORE #9010
5507 S WILLIAMSON BLVD
Rewards Number: LMR90152322948
PORT ORGANGE, FL 32128
8-9245 4415-1819-9921-4148-9111-1501-0261
4033602 SALE 0659 9010 002 1/04/22 13:03
CNDL 2002 HOLIDAY
19.99
6.00 P
647658036793
18 6.00
192040076524
ST TREND STYLE PH
5.99
5.98 P
2 @ 2.99
15.99
GA LINSEED REFINE
729911060087
12.79
1 @ 12.79
CPN GET ITM20% 3.20-
YOU SAVED $23.19
Coupon(s) Applied:
400100949528 CPN GET ITM20%
SUBTOTAL
24.77
PIF 1.00%
SUBTOTAL W/PIF
25.02
Sales Tax 6.5%
1.63
TOTAL
26.65
************4491
ACCOUNT NUMBER
Visa
26.65
APPROVAL: 00751C CHIP ONLINE
Application Label: VISA CREDIT
AID: A0000000031010
TVR: 0880008000
TSI: E800
This receipt expires at 60 days on 03/04/22
Previous Michaels Rewards Balance: $0.0
Click, Buy. Create. Shop michaels.com today!
Get Savings & Inspiration! Text* SIGNUP to 273283
To Sign Up for Email & Text Messages.
Msg & Data Rates May Apply
You will receive 1 autodialed message
with a link to join Michaels alerts.
Aaron Brothers
Custom Framing
New! Now in Over 1,200 Michaels Stores & Online
Now Hiring! Apply at michaels.com/jobs
THANK YOU FOR SHOPPING AT MICHAELS
Dear Valued Customer:
Michaels return and coupon pone at are over able
*** Please be advised, effective April 15th, 2021
Michaels
will be
moving from a 180 day return policy
to a 60 day
return policy from the date of purchase.
Please see a store
associate for more information.
1/04/22 13:03`);
		const {
			message: { content }
		} = await ollama({ model: 'mistral', prompt: prompt });
		const extractedJSON = extractJSONTextFromLLMResponse(content);
		// console.log(content);
		// console.log(extractedJSON);
		console.log(
			levenshtein.get(
				`Michael's
Made by you
MICHAELS STORE #9010 (386) 767-7495
MICHAELS STORE #9010
5507 S WILLIAMSON BLVD
Rewards Number: LMR90152322948
PORT ORGANGE, FL 32128
8-9245 4415-1819-9921-4148-9111-1501-0261
4033602 SALE 0659 9010 002 1/04/22 13:03
CNDL 2002 HOLIDAY
19.99
6.00 P
647658036793
18 6.00
192040076524
ST TREND STYLE PH
5.99
5.98 P
2 @ 2.99
15.99
GA LINSEED REFINE
729911060087
12.79
1 @ 12.79
CPN GET ITM20% 3.20-
YOU SAVED $23.19
Coupon(s) Applied:
400100949528 CPN GET ITM20%
SUBTOTAL
24.77
PIF 1.00%
SUBTOTAL W/PIF
25.02
Sales Tax 6.5%
1.63
TOTAL
26.65
************4491
ACCOUNT NUMBER
Visa
26.65
APPROVAL: 00751C CHIP ONLINE
Application Label: VISA CREDIT
AID: A0000000031010
TVR: 0880008000
TSI: E800
This receipt expires at 60 days on 03/04/22
Previous Michaels Rewards Balance: $0.0
Click, Buy. Create. Shop michaels.com today!
Get Savings & Inspiration! Text* SIGNUP to 273283
To Sign Up for Email & Text Messages.
Msg & Data Rates May Apply
You will receive 1 autodialed message
with a link to join Michaels alerts.
Aaron Brothers
Custom Framing
New! Now in Over 1,200 Michaels Stores & Online
Now Hiring! Apply at michaels.com/jobs
THANK YOU FOR SHOPPING AT MICHAELS
Dear Valued Customer:
Michaels return and coupon pone at are over able
*** Please be advised, effective April 15th, 2021
Michaels
will be
moving from a 180 day return policy
to a 60 day
return policy from the date of purchase.
Please see a store
associate for more information.
1/04/22 13:03`,
				JSON.stringify({ card: '4491', total: '26.65', merchant: 'Michaels', date: '01/04/22' })
			)
		);
		console.log(
			levenshtein.get(
				`Michael's
Made by you
MICHAELS STORE #9010 (386) 767-7495
MICHAELS STORE #9010
5507 S WILLIAMSON BLVD
Rewards Number: LMR90152322948
PORT ORGANGE, FL 32128
8-9245 4415-1819-9921-4148-9111-1501-0261
4033602 SALE 0659 9010 002 1/04/22 13:03
CNDL 2002 HOLIDAY
19.99
6.00 P
647658036793
18 6.00
192040076524
ST TREND STYLE PH
5.99
5.98 P
2 @ 2.99
15.99
GA LINSEED REFINE
729911060087
12.79
1 @ 12.79
CPN GET ITM20% 3.20-
YOU SAVED $23.19
Coupon(s) Applied:
400100949528 CPN GET ITM20%
SUBTOTAL
24.77
PIF 1.00%
SUBTOTAL W/PIF
25.02
Sales Tax 6.5%
1.63
TOTAL
26.65
************4491
ACCOUNT NUMBER
Visa
26.65
APPROVAL: 00751C CHIP ONLINE
Application Label: VISA CREDIT
AID: A0000000031010
TVR: 0880008000
TSI: E800
This receipt expires at 60 days on 03/04/22
Previous Michaels Rewards Balance: $0.0
Click, Buy. Create. Shop michaels.com today!
Get Savings & Inspiration! Text* SIGNUP to 273283
To Sign Up for Email & Text Messages.
Msg & Data Rates May Apply
You will receive 1 autodialed message
with a link to join Michaels alerts.
Aaron Brothers
Custom Framing
New! Now in Over 1,200 Michaels Stores & Online
Now Hiring! Apply at michaels.com/jobs
THANK YOU FOR SHOPPING AT MICHAELS
Dear Valued Customer:
Michaels return and coupon pone at are over able
*** Please be advised, effective April 15th, 2021
Michaels
will be
moving from a 180 day return policy
to a 60 day
return policy from the date of purchase.
Please see a store
associate for more information.
1/04/22 13:03`,
				JSON.stringify({ card: '5692', total: '100', merchant: 'McDonals', date: '12/23/23' })
			)
		);
	});
});
