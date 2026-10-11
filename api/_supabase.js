
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function supabaseRpc(functionName, body = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  const baseUrl = SUPABASE_URL.replace(/\/+$/, "");
  const response = await fetch(
    `${baseUrl}/rest/v1/rpc/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase returned HTTP ${response.status}.`);
  }

  return response.json();
}

module.exports = { supabaseRpc };
