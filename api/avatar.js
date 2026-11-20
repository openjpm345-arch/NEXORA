module.exports = async function handler(req, res) {
  const username = String(req.query.username || "CRAZYMADDOG01").trim();
  if (username !== "CRAZYMADDOG01") {
    return res.status(400).send("Invalid username");
  }

  try {
    const lookup = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false
      })
    });

    if (!lookup.ok) throw new Error("Roblox username lookup failed");
    const userData = await lookup.json();
    const user = userData.data && userData.data[0];
    if (!user || !user.id) throw new Error("Roblox user not found");

    const thumbnailResponse = await fetch(
      "https://thumbnails.roblox.com/v1/users/avatar?userIds=" +
      user.id + "&size=150x150&format=Png&isCircular=false"
    );
    if (!thumbnailResponse.ok) throw new Error("Roblox thumbnail lookup failed");

    const thumbnailData = await thumbnailResponse.json();
    const imageUrl = thumbnailData.data && thumbnailData.data[0] && thumbnailData.data[0].imageUrl;
    if (!imageUrl) throw new Error("Roblox avatar image unavailable");

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error("Roblox avatar image could not be downloaded");

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    res.setHeader("Content-Type", imageResponse.headers.get("content-type") || "image/png");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(imageBuffer);
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).send("Avatar unavailable");
  }
};
