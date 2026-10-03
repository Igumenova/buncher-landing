export const setSubscribeFormBehavior = function () {
  const form = document.getElementById("subscribe-form");
  const emailInput = form?.querySelector('input[name="email"]');
  const submitButton = form?.querySelector('button[type="submit"]');
  const status = form?.querySelector("[data-subscribe-status]");

  if (!form || !emailInput || !submitButton) {
    return;
  }

  const leadsEndpoint = "http://158.160.3.188:4001/leads";
  const invalidClass = "section-footer__subscribe-form_invalid";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = (email) => emailRegex.test(email.trim());
  const setStatus = (message, type = "") => {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.dataset.status = type;
  };

  form.setAttribute("novalidate", "");

  emailInput.addEventListener("input", () => {
    emailInput.removeAttribute("aria-invalid");
    setStatus("");

    if (!emailInput.value || isEmailValid(emailInput.value)) {
      form.classList.remove(invalidClass);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();

    if (!isEmailValid(email)) {
      form.classList.add(invalidClass);
      emailInput.setAttribute("aria-invalid", "true");
      setStatus("Введите корректный email", "error");
      emailInput.focus();
      return;
    }

    form.classList.remove(invalidClass);
    emailInput.removeAttribute("aria-invalid");
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    setStatus("Отправляем…");

    try {
      const response = await fetch(leadsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`Lead request failed with status ${response.status}`);
      }

      form.reset();
      setStatus("Спасибо! Мы сообщим о релизе.", "success");
    } catch (error) {
      console.error("Failed to submit lead", error);
      setStatus("Не удалось отправить. Попробуйте ещё раз.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
    }
  });
};
