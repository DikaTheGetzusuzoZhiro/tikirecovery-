const $ = s => document.querySelector(s);

// Popup follow TikTok. Ditampilkan sekali per browser.
const followModal = $("#followModal");
const closeFollow = () => {
  followModal?.classList.add("hidden");
  try { localStorage.setItem("tikiFollowPopupSeen", "1"); } catch {}
};
if (followModal) {
  try {
    if (localStorage.getItem("tikiFollowPopupSeen") === "1") followModal.classList.add("hidden");
  } catch {}
  $("#closeFollow")?.addEventListener("click", closeFollow);
  $("#laterFollow")?.addEventListener("click", closeFollow);
  followModal.addEventListener("click", e => { if (e.target === followModal) closeFollow(); });
}

const lookupForm = $("#lookupForm");
lookupForm.addEventListener("submit", async e => {
  e.preventDefault();
  const username = $("#usernameInput").value.trim().replace(/^@/, "");
  if (!username) return;
  $("#lookupError").classList.add("hidden");
  $("#profileCard").classList.add("hidden");
  $("#recoveryForm").classList.add("hidden");
  $("#lookupLoading").classList.remove("hidden");

  try {
    const r = await fetch("/api/roblox", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Gagal mencari akun.");

    const u = data.user;
    $("#avatar").src = u.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420'%3E%3Crect width='100%25' height='100%25' fill='%23160b24'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-size='42' text-anchor='middle' dominant-baseline='middle'%3ERBX%3C/text%3E%3C/svg%3E";
    $("#displayName").textContent = u.displayName || u.username;
    $("#usernameText").textContent = `@${u.username}`;
    $("#userId").textContent = u.id;

    // Status hanya Online/Offline. Tidak menampilkan lokasi/website/game.
    const isOnline = Number(u.presenceType) > 0;
    const status = isOnline ? "Online" : "Offline";
    $("#statusText").textContent = status;
    $("#banText").textContent = u.banned ? "Moderated" : "Normal";
    $("#createdText").textContent = u.created ? new Date(u.created).toLocaleDateString("id-ID", {day:"2-digit", month:"long", year:"numeric"}) : "-";

    const badge = $("#presenceBadge");
    badge.textContent = status;
    badge.className = `status ${isOnline ? "online" : "offline"}`;

    $("#recoveryUsername").value = u.username;
    $("#lookupLoading").classList.add("hidden");
    $("#profileCard").classList.remove("hidden");
  } catch (err) {
    $("#lookupLoading").classList.add("hidden");
    $("#lookupError").textContent = err.message;
    $("#lookupError").classList.remove("hidden");
  }
});

$("#recoverBtn").addEventListener("click", () => {
  $("#recoveryForm").classList.remove("hidden");
  $("#recoveryForm").scrollIntoView({behavior:"smooth", block:"center"});
});

$("#sendRecovery").addEventListener("click", () => {
  const username = $("#recoveryUsername").value;
  const problem = $("#problem").value;
  const story = $("#story").value.trim() || "-";
  const msg = encodeURIComponent(
    `Halo TIKI, saya ingin bantuan recovery akun Roblox.\nUsername: ${username}\nMasalah: ${problem}\nKronologi: ${story}`
  );
  window.open(`https://wa.me/62895391845923?text=${msg}`, "_blank", "noopener,noreferrer");
});
