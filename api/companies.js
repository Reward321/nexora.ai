
const { supabaseRpc } = require("./_supabase");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const companies = await supabaseRpc("get_public_companies");
    return res.status(200).json(Array.isArray(companies) ? companies : []);
  } catch (error) {
    console.error("Companies API error:", error.message);
    return res.status(500).json({ error: "Could not load companies." });
  }
};
