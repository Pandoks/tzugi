import { findUser } from '$lib/server/auth';
import { plaid } from '$lib/server/plaid';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { CountryCode, Products } from 'plaid';

export const GET: RequestHandler = async (event) => {
  const user = await findUser(event);
  if (!user) {
    return error(400, {
      message: 'User unauthorized'
    });
  }

  const request = {
    user: {
      client_user_id: user.id
    },
    client_name: 'Tzugi',
    products: [Products.Transactions],
    language: 'en',
    country_codes: [CountryCode.Us]
  };
  const tokenResponse = await plaid.linkTokenCreate(request);
  if (!tokenResponse) {
    return error(400, { message: "Couldn't get a token response" });
  }

  return json(tokenResponse.data);
};
