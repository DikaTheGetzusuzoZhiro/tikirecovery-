const axios = require("axios");

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function usernameOf(value) {
  return String(value || "").trim().replace(/^@/, "").slice(0, 20);
}

module.exports = async (req, res) => {
  // CORS is useful if the static page and API are served separately.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return send(res, 204, {});
  }

  if (req.method !== "POST") {
    return send(res, 405, { error: "Method not allowed" });
  }

  try {
    const username = usernameOf(req.body?.username);
    if (!username) return send(res, 400, { error: "Username wajib diisi." });

    const lookup = await axios.post(
      "https://users.roblox.com/v1/usernames/users",
      { usernames: [username], excludeBannedUsers: false },
      { timeout: 9000 }
    );

    const user = lookup.data?.data?.[0];
    if (!user) return send(res, 404, { error: "Username Roblox tidak ditemukan." });

    const [infoResult, avatarResult, presenceResult] = await Promise.allSettled([
      axios.get(`https://users.roblox.com/v1/users/${user.id}`, { timeout: 9000 }),
      axios.get("https://thumbnails.roblox.com/v1/users/avatar-headshot", {
        params: { userIds: user.id, size: "420x420", format: "Png", isCircular: false },
        timeout: 9000
      }),
      axios.post("https://presence.roblox.com/v1/presence/users",
        { userIds: [user.id] },
        { timeout: 9000 }
      )
    ]);

    const info = infoResult.status === "fulfilled" ? infoResult.value.data : {};
    const avatar = avatarResult.status === "fulfilled"
      ? avatarResult.value.data?.data?.[0]?.imageUrl || null
      : null;
    const presence = presenceResult.status === "fulfilled"
      ? presenceResult.value.data?.userPresences?.[0] || {}
      : {};

    const type = Number(presence.userPresenceType || 0);
    const status = type === 0 ? "Offline"
      : type === 2 ? "In Game"
      : type === 3 ? "In Roblox Studio"
      : "Online";

    return send(res, 200, {
      ok: true,
      user: {
        id: user.id,
        username: user.name,
        displayName: user.displayName,
        created: info.created || null,
        description: info.description || "",
        banned: !!info.isBanned,
        avatar,
        status,
        presenceType: type,
        lastLocation: presence.lastLocation || ""
      }
    });
  } catch (err) {
    console.error("Roblox lookup:", err?.response?.data || err?.message || err);
    return send(res, 502, { error: "Gagal mengambil data Roblox. Coba lagi." });
  }
};
