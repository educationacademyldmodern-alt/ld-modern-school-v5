
/* LD Modern School - Teacher + Parent Password Login Fix
   Upload this file to the repository root as auth-fix.js
   Then add: <script src="auth-fix.js"></script> before </body> in index.html
*/
(function () {
  const byId = (id) => document.getElementById(id);
  const notify = (msg) => {
    if (typeof window.toast === "function") window.toast(msg);
    else alert(msg);
  };

  async function resolveEmail(identifier, role) {
    const raw = String(identifier || "").trim();
    if (!raw) throw new Error("Email या Mobile Number डालें");
    if (raw.includes("@")) return raw.toLowerCase();

    const digits = raw.replace(/\D/g, "");
    if (digits.length < 10) throw new Error("सही Mobile Number डालें");

    const { data, error } = await window.sb.rpc("resolve_school_login_email", {
      p_identifier: digits.slice(-10),
      p_role: role
    });
    if (error) throw error;
    if (!data) throw new Error("इस Mobile Number से कोई login account नहीं मिला");
    return String(data).toLowerCase();
  }

  async function signInByIdentifier(identifier, password, role) {
    if (!password || password.length < 6) throw new Error("Password कम से कम 6 अक्षर का रखें");
    const email = await resolveEmail(identifier, role);
    const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  window.teacherLoginDialog = function () {
    if (!window.cfg) return window.openPortal();
    window.v14Modal(`
      <h2>Teacher Portal</h2>
      <p class="v14Muted">Email या Mobile Number और Password से Login करें। पहली बार Registration Admin approval के बाद active होगा.</p>
      <div class="v14Tabs">
        <button onclick="teacherExistingLoginForm()">Teacher Login</button>
        <button onclick="teacherPasswordRegistrationForm()">First Registration</button>
      </div>
      <div id="teacherAuthBox"></div>
    `);
    window.teacherExistingLoginForm();
  };

  window.teacherExistingLoginForm = function () {
    byId("teacherAuthBox").innerHTML = `
      <div class="v14Form">
        <div class="full">
          <label>Email or Mobile Number</label>
          <input id="tLoginId" type="text" placeholder="Email or 10 digit mobile">
        </div>
        <div class="full">
          <label>Password</label>
          <input id="tLoginPassword" type="password" placeholder="Password">
        </div>
        <div class="full">
          <button class="v14Action primary" onclick="teacherPasswordLogin()">Login</button>
        </div>
        <div class="full otpHelp">
          Password भूल गए हों तो नीचे Reset Password चुनें.
        </div>
        <div class="full">
          <button class="v14Action" onclick="teacherResetPassword()">Reset Password</button>
        </div>
      </div>`;
  };

  window.teacherPasswordLogin = async function () {
    try {
      const data = await signInByIdentifier(
        byId("tLoginId")?.value,
        byId("tLoginPassword")?.value,
        "teacher"
      );
      window.user = data.user;
      await window.loadProfile();
      if (typeof window.v14LoadTeacherContext === "function") await window.v14LoadTeacherContext();

      if (!window.v14TeacherProfile) {
        await window.sb.auth.signOut();
        return notify("Teacher profile नहीं मिला। First Registration करें.");
      }
      if (
        window.v14TeacherProfile.approval_status !== "Approved" ||
        window.profile?.role !== "teacher"
      ) {
        await window.sb.auth.signOut();
        return notify("Teacher account अभी Admin approval में है");
      }
      document.getElementById("v14Modal")?.remove();
      window.openERP();
    } catch (e) {
      notify(e.message || "Login failed");
    }
  };

  window.teacherPasswordRegistrationForm = function () {
    byId("teacherAuthBox").innerHTML = `
      <div class="v14Form">
        <div class="full">
          <label>Teacher Email</label>
          <input id="tRegisterEmail2" type="email" placeholder="teacher@example.com">
        </div>
        <div class="full">
          <label>Create Password</label>
          <input id="tRegisterPassword2" type="password" placeholder="Minimum 6 characters">
        </div>
        <div class="full">
          <button class="v14Action primary" onclick="teacherStartPasswordRegistration()">Continue Registration</button>
        </div>
        <div class="full otpHelp">
          Email confirmation enabled होने पर पहली बार email verify करना पड़ सकता है; उसके बाद हमेशा Password से Login होगा.
        </div>
      </div>`;
  };

  window.teacherStartPasswordRegistration = async function () {
    try {
      const email = String(byId("tRegisterEmail2")?.value || "").trim().toLowerCase();
      const password = String(byId("tRegisterPassword2")?.value || "");
      if (!email.includes("@")) throw new Error("Valid email डालें");
      if (password.length < 6) throw new Error("Password कम से कम 6 अक्षर का रखें");

      const { data, error } = await window.sb.auth.signUp({
        email,
        password,
        options: { data: { requested_role: "teacher" } }
      });
      if (error) throw error;

      if (!data.session) {
        notify("Email verification भेजा गया है। Verify करके फिर इसी Email + Password से Login करें.");
        return;
      }

      window.user = data.user;
      await window.loadProfile();
      window.teacherProfileRegistrationForm(email);
    } catch (e) {
      notify(e.message || "Registration failed");
    }
  };

  window.teacherResetPassword = async function () {
    try {
      const id = String(byId("tLoginId")?.value || "").trim();
      const email = await resolveEmail(id, "teacher");
      const redirectTo = location.origin + location.pathname + "#teacherPortal";
      const { error } = await window.sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      notify("Password reset email भेज दिया गया");
    } catch (e) {
      notify(e.message || "Reset failed");
    }
  };

  window.parentPasswordLogin = async function () {
    try {
      const data = await signInByIdentifier(
        byId("parentLoginId")?.value,
        byId("parentLoginPassword")?.value,
        "parent"
      );
      window.parentVerifiedEmail = String(data.user?.email || "").toLowerCase();
      byId("parentGate")?.classList.add("hidden");
      byId("parentDashboard")?.classList.remove("hidden");
      await window.loadParentPortal();
    } catch (e) {
      notify(e.message || "Login failed");
    }
  };

  window.parentCreatePassword = async function () {
    try {
      const email = String(byId("parentCreateEmail")?.value || "").trim().toLowerCase();
      const password = String(byId("parentCreatePassword")?.value || "");
      if (!email.includes("@")) throw new Error("Valid parent email डालें");
      if (password.length < 6) throw new Error("Password कम से कम 6 अक्षर का रखें");

      const { data, error } = await window.sb.auth.signUp({
        email,
        password,
        options: { data: { requested_role: "parent" } }
      });
      if (error) throw error;

      if (!data.session) {
        notify("Email verification भेजा गया है। Verify के बाद Email/Mobile + Password से Login करें.");
        return;
      }
      notify("Parent account तैयार है। अब Login करें.");
      await window.sb.auth.signOut();
    } catch (e) {
      notify(e.message || "Account creation failed");
    }
  };

  window.parentResetPassword = async function () {
    try {
      const id = String(byId("parentLoginId")?.value || "").trim();
      const email = await resolveEmail(id, "parent");
      const redirectTo = location.origin + location.pathname + "#parentPortal";
      const { error } = await window.sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      notify("Password reset email भेज दिया गया");
    } catch (e) {
      notify(e.message || "Reset failed");
    }
  };

  function installParentPasswordUI() {
    const gate = byId("parentGate");
    if (!gate) return;

    gate.innerHTML = `
      <h3>Parent Login</h3>
      <div class="v14Form">
        <div class="full">
          <label>Email or Mobile Number</label>
          <input id="parentLoginId" type="text" placeholder="Registered email or 10 digit mobile">
        </div>
        <div class="full">
          <label>Password</label>
          <input id="parentLoginPassword" type="password" placeholder="Password">
        </div>
        <div class="full">
          <button class="v14Action primary" type="button" onclick="parentPasswordLogin()">Login</button>
        </div>
        <div class="full v14Tabs">
          <button class="v14Action" type="button" onclick="parentFirstTimePasswordForm()">First Time / Create Password</button>
          <button class="v14Action" type="button" onclick="parentResetPassword()">Reset Password</button>
        </div>
        <div id="parentFirstTimeBox" class="full"></div>
      </div>`;
  }

  window.parentFirstTimePasswordForm = function () {
    const box = byId("parentFirstTimeBox");
    if (!box) return;
    box.innerHTML = `
      <div class="v14Form">
        <div class="full">
          <label>Registered Parent Email</label>
          <input id="parentCreateEmail" type="email" placeholder="parent@example.com">
        </div>
        <div class="full">
          <label>Create Password</label>
          <input id="parentCreatePassword" type="password" placeholder="Minimum 6 characters">
        </div>
        <div class="full">
          <button class="v14Action primary" type="button" onclick="parentCreatePassword()">Create Password Account</button>
        </div>
      </div>`;
  };

  // Change labels/text that still mention magic-link login.
  function cleanMagicLinkText() {
    const p = document.querySelector("#parentPortal .sectionLead");
    if (p) p.textContent = "Registered Email या Mobile Number और Password से secure Parent Login करें.";
    const tBtn = byId("teacherLoginBtn");
    if (tBtn) tBtn.textContent = "Teacher Login / Registration";
  }

  function install() {
    installParentPasswordUI();
    cleanMagicLinkText();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
})();
