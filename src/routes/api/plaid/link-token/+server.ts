import { PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from '$env/static/public';
export const POST = async (event) => {
  // Get the client_user_id by searching for the current user
  const request = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: "test",
    },
    client_name: 'Plaid Test App',
    products: ['auth'],
    language: 'en',
    webhook: 'https://webhook.example.com',
    redirect_uri: 'https://domainname.com/oauth-page.html',
    country_codes: ['US'],
  };
  try {
    const createTokenResponse = await client.linkTokenCreate(request);
    response.json(createTokenResponse.data);
  } catch (error) {
    // handle error
  }
});
