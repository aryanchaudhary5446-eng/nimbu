
/* NIMBU Personal Profile */
(function () {
  const client = window.NIMBU_SUPABASE;
  if (!client) {
    console.error("NIMBU Supabase client is unavailable.");
    return;
  }

  document.addEventListener("click", async function (event) {
    const button = event.target.closest("#profileBtn");
    if (!button) return;

    const { data: authData, error: authError } =
      await client.auth.getUser();

    if (authError || !authData.user) {
      window.location.replace("welcome.html");
      return;
    }

    const user = authData.user;
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
      <section style="max-width:620px;margin:30px auto;padding:24px;border:1px solid #444;border-radius:20px">
        <h1>My NIMBU Profile</h1>
        <p>Manage your personal account details.</p>
        <img id="profileAvatar" alt="Profile photo"
          style="width:100px;height:100px;border-radius:50%;object-fit:cover;background:#333">
        <p><label>Profile photo
          <input id="profilePhoto" type="file" accept="image/*">
        </label></p>
        <p><label>Gmail / account email<br>
          <input id="profileEmail" type="email" readonly
            style="width:100%;padding:12px" value="${String(user.email || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;")}">
        </label></p>
        <p><label>Full name<br>
          <input id="profileName" maxlength="80" style="width:100%;padding:12px">
        </label></p>
        <p><label>Username<br>
          <input id="profileUsername" maxlength="30" placeholder="your_username"
            style="width:100%;padding:12px">
        </label></p>
        <p><label>Bio<br>
          <textarea id="profileBio" maxlength="300" rows="4"
            style="width:100%;padding:12px"></textarea>
        </label></p>
        <button id="saveProfile" type="button">Save profile</button>
        <button id="backProfile" type="button">Back to NIMBU</button>
        <p id="profileMessage" role="status"></p>
      </section>`;

    const byId = id => document.getElementById(id);
    const message = byId("profileMessage");
    let avatarFile = null;
    let existingAvatarPath = null;

    const { data: profile, error: readError } = await client
      .from("nimbu_profiles")
      .select("username,full_name,bio,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (readError) {
      message.textContent = "Couldn't load profile: " + readError.message;
      return;
    }

    if (profile) {
      byId("profileName").value = profile.full_name || "";
      byId("profileUsername").value = profile.username || "";
      byId("profileBio").value = profile.bio || "";
      existingAvatarPath = profile.avatar_url || null;

      if (existingAvatarPath) {
        const { data: signed } = await client.storage
          .from("nimbu-avatars")
          .createSignedUrl(existingAvatarPath, 3600);
        if (signed?.signedUrl) byId("profileAvatar").src = signed.signedUrl;
      }
    }

    byId("profilePhoto").addEventListener("change", function () {
      avatarFile = this.files && this.files[0];
      if (!avatarFile) return;

      if (!avatarFile.type.startsWith("image/") ||
          avatarFile.size > 3 * 1024 * 1024) {
        avatarFile = null;
        this.value = "";
        message.textContent = "Choose an image under 3 MB.";
        return;
      }

      byId("profileAvatar").src = URL.createObjectURL(avatarFile);
      message.textContent = "Photo selected. Save profile to upload.";
    });

    byId("saveProfile").addEventListener("click", async function () {
      const name = byId("profileName").value.trim();
      const username = byId("profileUsername").value.trim().toLowerCase();
      const bio = byId("profileBio").value.trim();

      if (username && !/^[a-z0-9_]{3,30}$/.test(username)) {
        message.textContent =
          "Username must be 3–30 characters: lowercase letters, numbers or underscores.";
        return;
      }

      this.disabled = true;
      message.textContent = "Saving…";

      try {
        let avatarPath = existingAvatarPath;

        if (avatarFile) {
          const extension = ({
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/gif": "gif"
          })[avatarFile.type];

          if (!extension) throw new Error("Use a JPG, PNG, WEBP or GIF image.");

          avatarPath = user.id + "/avatar." + extension;

          const { error: uploadError } = await client.storage
            .from("nimbu-avatars")
            .upload(avatarPath, avatarFile, {
              upsert: true,
              contentType: avatarFile.type
            });

          if (uploadError) throw uploadError;
        }

        const { error: saveError } = await client
          .from("nimbu_profiles")
          .upsert({
            id: user.id,
            username: username || null,
            full_name: name,
            bio,
            avatar_url: avatarPath,
            updated_at: new Date().toISOString()
          }, { onConflict: "id" });

        if (saveError) throw saveError;

        existingAvatarPath = avatarPath;
        avatarFile = null;
        message.textContent = "Profile saved successfully!";
      } catch (error) {
        console.error("Profile save failed:", error);
        message.textContent = "Save failed: " + error.message;
      } finally {
        this.disabled = false;
      }
    });

    byId("backProfile").addEventListener("click", function () {
      window.location.hash = "#/";
      window.location.reload();
    });
  });
})();
