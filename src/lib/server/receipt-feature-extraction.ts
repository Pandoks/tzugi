/**
 * Use LLMs and OCR (Google AI APIs) to extract features out of images
 */

import type { Transaction } from 'plaid';
import { detectWordsFromImage } from './google-vision';
import { ollama } from './ollama';
import levenshtein from 'fast-levenshtein';

export const receiptFeatureExtraction = async (receiptImage: File) => {
  const buffer = Buffer.from(await receiptImage.arrayBuffer());
  const { data, error } = await detectWordsFromImage(buffer);
  // 	const prompt = `
  // Based on the following text, what is the total of the transaction, date of the transaction, payment channel of transaction, merchant name of the transaction, and the last 4 digits of the credit card used for the transaction?
  // Give me the answer in strictly json: {total: <total>, date: <date>, channel: <channel>, merchant: <merchant>, card: <card>}. Here are the instructions for the json:
  // For payment channel this is a description of the ONLY options you can choose from. Do not make up anything. Only choose from this list:
  // "online": transactions that took place online; "in store": transactions that were made at a physical location; "other": transactions that relate to banks, e.g. fees or deposits
  // For the date field, make sure you also include the time in parentheses. Different receipts may have different formatted dates and times. You will use this format even if the format of the date on the receipt is different:
  // date: YYYY-MM-DD (HH:MM) where HH:MM is in 24 hour format. If you can't figure out the time, then only put ().
  // For card field in the json, ONLY include the last 4 or 5 digits. Do NOT include "*" or any other symbols. There should only be 4 or 5 NUMBERS.
  // For total, only include the number (ie. NNN.NN) with no symbols.
  // If you cannot justify your answer or don't 100% know for sure, just put the field as null.
  // Don't give me anything else. Only reply with json where each field is a string.
  //
  // Here is the data:
  // ${data}
  // `;
  const prompt = `
This is some text that is extracted from a transaction receipt: ${data}.

Respond in only JSON format and nothing else.

This is the JSON format and description of each field:
\`\`\`js
{
total: // The total that the person paid for the transaction. If there is no total, it should be "".
date: // The date of the transaction. Format: YYYY-MM-DD (HH:MM). If there is no date, it should be "". If there is no time it should be YYYY-MM-DD ().
channel: // "online": transactions that took place online | "in store": transactions that were made at a physical location | "other": transactions that relate to banks, e.g. fees or deposits. If there is no channel, it should be "".
merchant: // The merchant the person paid. If there is no merchant, it should be "".
card: // The last 4 or 5 digits of the card that the paying person used. Do not include "*" or other symbols. If there is not card digits, it should be "".
}
\`\`\`
Make sure to include all fields.

Give an explanation on how you got to the answer for each field.
`;

  const {
    message: { content }
  } = await ollama({ model: 'mixtral', prompt: prompt });
  return content;
};

export type ReceiptFeatures = {
  total: string;
  date: string;
  merchant: string;
};

export type ReceiptTransactionSimilarity = {
  total: number;
  date: number;
  merchant: number;
};

export const receiptTransactionFeatureSimilarity = ({
  receipt,
  transaction
}: {
  receipt: ReceiptFeatures;
  transaction: Transaction;
}) => {
  let receiptTransactionSimilarity: ReceiptTransactionSimilarity = {
    total: Infinity,
    date: Infinity,
    merchant: Infinity
  };

  // lower distance the more similar (0 is exactly the same)
  receiptTransactionSimilarity.total = levenshtein.get(
    receipt.total,
    transaction.amount.toString()
  );

  receiptTransactionSimilarity.date = levenshtein.get(receipt.date, transaction.date);

  receiptTransactionSimilarity.merchant = levenshtein.get(
    receipt.merchant,
    transaction.merchant_name ? transaction.merchant_name : ''
  );

  return receiptTransactionSimilarity;
};
