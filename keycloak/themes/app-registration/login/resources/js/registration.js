const registrationLink = document.querySelector("#kc-registration a");
const registrationUrl = document.currentScript.dataset.registrationUrl;

if (registrationLink && registrationUrl) {
  registrationLink.href = registrationUrl;
}
