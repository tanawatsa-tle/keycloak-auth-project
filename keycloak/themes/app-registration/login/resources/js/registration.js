const registrationLink = document.querySelector("#kc-registration a");
const registrationUrl = document.currentScript.dataset.registrationUrl;

if (registrationLink && registrationUrl) {
  registrationLink.href = registrationUrl;
}

const socialSignup = document.getElementById("kc-social-signup");
const microsoftLogin = document.querySelector("#social-microsoft");
if (!socialSignup && microsoftLogin && registrationUrl) {
  microsoftLogin.href = new URL("./login/microsoft", registrationUrl.replace(/\/$/, "")).href;
}

for (const [id, label] of [
  ["social-google", "Sign up with Google"],
  ["social-microsoft", "Sign up with Microsoft"],
]) {
  const link = socialSignup?.querySelector(`#${id}`);
  const text = link?.querySelector("span");
  if (text) {
    text.textContent = label;
    link.setAttribute("aria-label", label);
  }
}

const backToLogin = document.querySelector("#kc-register-form #kc-form-options");
const registrationFooter = backToLogin?.closest(".pf-v5-c-login__main-footer-band");

if (socialSignup && registrationFooter) {
  registrationFooter.before(socialSignup);
}
