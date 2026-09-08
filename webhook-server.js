import crypto from "crypto"

app.post("/webhooks/grant-role", express.json(), async (req, res) => {
  const signature = req.headers["x-yumi-signature"]
  const expected = crypto
    .createHmac("sha256", process.env.DISCORD_BOT_WEBHOOK_SECRET || "")
    .update(JSON.stringify(req.body))
    .digest("hex")

  if (!signature || signature !== expected) {
    return res.status(401).json({ ok: false, error: "invalid_signature" })
  }

  const { discordId, guildId } = req.body || {}
  if (!discordId || !guildId) {
    return res.status(400).json({ ok: false, error: "invalid_payload" })
  }

  try {
    const guild = await client.guilds.fetch(guildId)
    const member = await guild.members.fetch(discordId)
    const roleId = process.env.VERIFIED_ROLE_ID

    if (!roleId) {
      console.error("VERIFIED_ROLE_ID not configured")
      return res.status(500).json({ ok: false, error: "role_not_configured" })
    }

    await member.roles.add(roleId)
    return res.json({ ok: true })
  } catch (err) {
    console.error("Failed to grant verified role:", err)
    return res.status(500).json({ ok: false, error: "grant_failed" })
  }
})