export const setSubscribeFormBehavior = function () {
  const form = document.getElementById("subscribe-form");
  const emailInput = form?.querySelector('input[name="email"]');

  if (!form || !emailInput) {
    return;
  }

  const invalidClass = "section-footer__subscribe-form_invalid";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = (email) => emailRegex.test(email.trim());

  form.setAttribute("novalidate", "");

  emailInput.addEventListener("input", () => {
    if (!emailInput.value || isEmailValid(emailInput.value)) {
      form.classList.remove(invalidClass);
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();

    if (!isEmailValid(email)) {
      form.classList.add(invalidClass);
      emailInput.focus();
      return;
    }

    console.log(email);
    form.classList.remove(invalidClass);
    form.reset();
  });
};
