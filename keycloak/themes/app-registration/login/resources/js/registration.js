const registrationLink = document.querySelector("#kc-registration a");
const registrationUrl = document.currentScript.dataset.registrationUrl;

if (registrationLink && registrationUrl) {
  registrationLink.href = registrationUrl;
}

const googleSignup = document.getElementById("kc-google-signup");
const googleSignupLink = googleSignup?.querySelector("#social-google");
const googleSignupLabel = googleSignupLink?.querySelector("span");
if (googleSignupLabel) {
  const label = "Sign up with Google";
  googleSignupLabel.textContent = label;
  googleSignupLink.setAttribute("aria-label", label);
}

const backToLogin = document.querySelector("#kc-register-form #kc-form-options");
const registrationFooter = backToLogin?.closest(".pf-v5-c-login__main-footer-band");

if (googleSignup && registrationFooter) {
  registrationFooter.before(googleSignup);
}
