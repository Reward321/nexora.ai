
const { supabaseRpc } = require("./_supabase");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const slug = typeof req.query.slug === "string"
    ? req.query.slug.trim()
    : "";

  if (!/^[a-z0-9-]{1,60}$/.test(slug)) {
    return res.status(400).json({ error: "Invalid company slug." });
  }

  try {
    const company = await supabaseRpc("get_public_company", {
      p_slug: slug
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found." });
    }

    return res.status(200).json(company);
  } catch (error) {
    console.error("Company API error:", error.message);
    return res.status(500).json({ error: "Could not load company." });
  }
};
