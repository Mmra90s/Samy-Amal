/**
 * ============================================================
 *  المنطق الرئيسي للموقع — مبني بالكامل على WEDDING_CONFIG
 * ============================================================
 */
(function () {
  "use strict";

  const cfg = WEDDING_CONFIG;

  /* ---------------------------------------------------------
   * 1) تعبئة المحتوى النصي من ملف الإعدادات
   * ------------------------------------------------------- */
  function hydrateText() {
    document.title = cfg.couple.pageTitle;
    document.getElementById("gateNames").innerHTML =
      `${cfg.couple.bride} <span class="amp">&amp;</span> ${cfg.couple.groom}`;
    document.getElementById("brideName").textContent = cfg.couple.bride;
    document.getElementById("groomName").textContent = cfg.couple.groom;
    document.getElementById("footerNames").textContent = `${cfg.couple.bride} و ${cfg.couple.groom}`;

    const ayahEl = document.getElementById("ayahText");
    ayahEl.innerHTML = `${escapeHtml(cfg.ayah.text)}<cite>${escapeHtml(cfg.ayah.reference)}</cite>`;

    document.getElementById("inviteText").textContent = cfg.inviteText;
    document.getElementById("heroDate").textContent = cfg.event.dateDisplay;
    document.getElementById("venueName").textContent = cfg.location.name;
  }

  /* ---------------------------------------------------------
   * 2) زر "حفظ التاريخ" — رابط تقويم Google ديناميكي
   * ------------------------------------------------------- */
  function buildSaveDateLink() {
    const start = new Date(cfg.event.dateISO);
    const end = new Date(start.getTime() + cfg.event.durationHours * 60 * 60 * 1000);

    const toGCal = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `دعوة زفاف ${cfg.couple.groom} & ${cfg.couple.bride}`,
      dates: `${toGCal(start)}/${toGCal(end)}`,
      details: cfg.inviteText,
      location: cfg.location.name,
    });

    document.getElementById("saveDateBtn").href =
      `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /* ---------------------------------------------------------
   * 3) العد التنازلي
   * ------------------------------------------------------- */
  function startCountdown() {
    const target = new Date(cfg.event.dateISO).getTime();
    const els = {
      d: document.getElementById("cdDays"),
      h: document.getElementById("cdHours"),
      m: document.getElementById("cdMinutes"),
      s: document.getElementById("cdSeconds"),
    };
    const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        els.d.textContent = els.h.textContent = els.m.textContent = els.s.textContent = "00";
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      els.d.textContent = pad(days);
      els.h.textContent = pad(hours);
      els.m.textContent = pad(mins);
      els.s.textContent = pad(secs);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------
   * 4) برنامج الحفل (Timeline)
   * ------------------------------------------------------- */
  function renderTimeline() {
    const list = document.getElementById("timelineList");
    list.innerHTML = cfg.timeline
      .map(
        (item, i) => `
      <li class="timeline__item reveal" style="--delay:${i * 90}ms">
        <div class="timeline__marker">
          <svg viewBox="0 0 120 120"><use href="#rosette"></use></svg>
        </div>
        <div class="timeline__body">
          <span class="timeline__time">${item.time}</span>
          <h3 class="timeline__title">${item.title}</h3>
          <p class="timeline__desc">${item.desc}</p>
        </div>
      </li>`
      )
      .join("");
  }

  /* ---------------------------------------------------------
   * 5) معرض الصور + عارض مكبّر (Lightbox)
   * ------------------------------------------------------- */
  function renderGallery() {
    const grid = document.getElementById("galleryGrid");
    grid.innerHTML = cfg.gallery
      .map(
        (img, i) => `
      <button type="button" class="gallery__item reveal" style="--delay:${i * 80}ms" data-index="${i}" aria-label="عرض ${img.alt}">
        <img src="${img.src}" alt="${img.alt}" loading="lazy"
             onerror="this.closest('.gallery__item').classList.add('gallery__item--empty'); this.remove();">
        <span class="gallery__frame" aria-hidden="true"></span>
      </button>`
      )
      .join("");

    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".gallery__item");
      if (!btn || btn.classList.contains("gallery__item--empty")) return;
      openLightbox(cfg.gallery[Number(btn.dataset.index)]);
    });
  }

  function openLightbox(img) {
    const overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <button class="lightbox__close" aria-label="إغلاق">&times;</button>
      <img src="${img.src}" alt="${img.alt}">`;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => overlay.classList.add("lightbox--open"));

    function close() {
      overlay.classList.remove("lightbox--open");
      document.body.style.overflow = "";
      setTimeout(() => overlay.remove(), 250);
    }
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest(".lightbox__close")) close();
    });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });
  }

  /* ---------------------------------------------------------
   * 6) الخريطة وروابط الموقع
   * ------------------------------------------------------- */
  function setupMap() {
    const q = encodeURIComponent(cfg.location.mapQuery);
    document.getElementById("mapFrame").src =
      `https://maps.google.com/maps?q=${q}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    document.getElementById("mapLink").href =
      `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------------------------------------------------------
   * 7) شاشة الدخول (الختم) — أنيميشن فتح الدعوة
   * ------------------------------------------------------- */
  function setupGate() {
    const gate = document.getElementById("gate");
    const site = document.getElementById("site");
    const sealBtn = document.getElementById("sealBtn");

    function openInvitation() {
      gate.classList.add("gate--open");
      site.removeAttribute("aria-hidden");
      document.body.style.overflow = "";
      if (cfg.settings.showGateOnce) sessionStorage.setItem("gateOpened", "1");
      setTimeout(() => gate.remove(), 900);
      revealOnScroll();
    }

    if (cfg.settings.showGateOnce && sessionStorage.getItem("gateOpened")) {
      openInvitation();
      return;
    }

    document.body.style.overflow = "hidden";
    sealBtn.addEventListener("click", openInvitation);
  }

  /* ---------------------------------------------------------
   * 11) ظهور تدريجي للعناصر عند التمرير
   * ------------------------------------------------------- */
  function revealOnScroll() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
   * التشغيل
   * ------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    hydrateText();
    buildSaveDateLink();
    startCountdown();
    renderTimeline();
    renderGallery();
    setupMap();
    setupGate();
    revealOnScroll();
  });
})();
