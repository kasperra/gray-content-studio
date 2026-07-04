/* Gray Content Studio — interactions */

(function () {
  "use strict";

  /* ----- Nav scroll state ----- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ----- Scroll reveals ----- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ----- Portfolio filters ----- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".work-card[data-category]");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.filter;
      cards.forEach((card) => {
        const show = cat === "all" || card.dataset.category === cat;
        card.classList.toggle("hidden", !show);
        if (show) {
          card.classList.remove("visible");
          requestAnimationFrame(() =>
            requestAnimationFrame(() => card.classList.add("visible"))
          );
        }
      });
    });
  });

  /* ----- Lightbox ----- */
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    const mediaBox = lightbox.querySelector(".lightbox-media");
    const tagEl = lightbox.querySelector(".work-tag");
    const titleEl = lightbox.querySelector("h3");
    const descEl = lightbox.querySelector("p");
    const closeBtn = lightbox.querySelector(".lightbox-close");
    let lastFocus = null;

    const open = (card) => {
      lastFocus = card;
      const img = card.querySelector(".work-media img");
      if (img) {
        mediaBox.classList.remove("is-type");
        mediaBox.innerHTML = "";
        const full = document.createElement("img");
        full.src = img.src;
        full.alt = img.alt;
        mediaBox.appendChild(full);
      } else {
        mediaBox.classList.add("is-type");
        mediaBox.innerHTML =
          '<div class="type-mark">' + card.dataset.client + "</div>";
      }
      tagEl.textContent = card.dataset.tag;
      titleEl.textContent = card.dataset.client;
      descEl.textContent = card.dataset.description;
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };

    const close = () => {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    cards.forEach((card) => card.addEventListener("click", () => open(card)));
    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open")) close();
    });
  }

  /* ----- Inquiry form ----- */
  const form = document.getElementById("inquiry-form");
  if (form) {
    const status = form.querySelector(".form-status");
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.querySelector('[name="_gotcha"]').value) return; // honeypot
      status.className = "form-status";
      status.textContent = "Sending…";
      submitBtn.disabled = true;
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          form.reset();
          status.className = "form-status ok";
          status.textContent =
            "Thank you — your inquiry is in. We'll be in touch within one business day.";
        } else {
          throw new Error("Request failed");
        }
      } catch (err) {
        status.className = "form-status err";
        status.textContent =
          "Something went wrong sending your message. Please email us directly instead.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
})();
