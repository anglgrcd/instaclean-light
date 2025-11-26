// script.js

// Helper: on DOM loaded
document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  initStickyHeader();
  initNavToggle();
  initSmoothScrollCloseNav();
  initScrollReveal();
  initLightbox();
  initAutoplayVideos();
  initOrgCarousel();
});

/* Set footer year */
function setCurrentYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/* Sticky header using IntersectionObserver */
function initStickyHeader() {
  const header = document.querySelector(".site-header");
  const hero = document.getElementById("hero");
  if (!header || !hero || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          header.classList.add("is-sticky");
        } else {
          header.classList.remove("is-sticky");
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(hero);
}

/* Mobile nav toggle */
function initNavToggle() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  if (!header || !toggle) return;

  toggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("nav-open");
    toggle.classList.toggle("is-active", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

/* Smooth scroll (CSS handles actual scroll), close nav on link click */
function initSmoothScrollCloseNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelectorAll(".main-nav a[href^='#']");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (!target) return;
      // Let CSS scroll-behavior handle smooth scroll, but prevent default for safety
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      // Close mobile nav if open
      if (header && header.classList.contains("nav-open")) {
        header.classList.remove("nav-open");
        if (toggle) {
          toggle.classList.remove("is-active");
          toggle.setAttribute("aria-expanded", "false");
        }
      }
    });
  });
}

/* Scroll reveal using IntersectionObserver */
function initScrollReveal() {
  const revealEls = document.querySelectorAll(".section.reveal");
  if (!("IntersectionObserver" in window) || !revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* Unified lightbox / fullscreen media logic */
function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const mediaContainer = lightbox.querySelector(".lightbox-media");
  const captionEl = lightbox.querySelector(".lightbox-caption");
  const closeBtn = lightbox.querySelector(".lightbox-close");

  function clearLightbox() {
    if (mediaContainer) {
      mediaContainer.innerHTML = "";
    }
    if (captionEl) {
      captionEl.textContent = "";
    }
  }

  function openLightbox(type, src, title) {
    if (!mediaContainer || !src) return;
    clearLightbox();

    let el;
    if (type === "video") {
      el = document.createElement("video");
      el.src = src;
      el.controls = true;
      el.autoplay = true;
      el.playsInline = true;
    } else if (type === "audio") {
      el = document.createElement("audio");
      el.src = src;
      el.controls = true;
      el.autoplay = true;
    } else {
      el = document.createElement("img");
      el.src = src;
      el.alt = title || "";
    }

    mediaContainer.appendChild(el);
    if (captionEl) captionEl.textContent = title || "";

    lightbox.classList.add("is-active");
    document.body.classList.add("no-scroll");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    clearLightbox();
    lightbox.classList.remove("is-active");
    document.body.classList.remove("no-scroll");
    lightbox.setAttribute("aria-hidden", "true");
  }

  // Click handling for any .media-trigger
  document.addEventListener("click", (event) => {
  const trigger = event.target.closest(".media-trigger");
  if (!trigger) return;

  const mediaType = trigger.dataset.mediaType || "image";

  // ⛔ STOP HERE — DO NOT OPEN LIGHTBOX FOR VIDEOS
  if (mediaType === "video") {
    return; // allow default video behavior (play, fullscreen via native controls)
  }

  // Proceed only for images & audio
  let src = trigger.dataset.src || "";
  let title = trigger.dataset.title || "";

  if (!src) {
    if (trigger.tagName.toLowerCase() === "img") {
      src = trigger.getAttribute("src");
      title = title || trigger.getAttribute("alt") || "";
    } else if (trigger.tagName.toLowerCase() === "audio") {
      src =
        trigger.currentSrc ||
        trigger.getAttribute("src") ||
        (trigger.querySelector("source") &&
          trigger.querySelector("source").src);
      title =
        title ||
        trigger.getAttribute("title") ||
        trigger.getAttribute("aria-label") ||
        "";
    }
  }

  if (!src) return;
  event.preventDefault();
  openLightbox(mediaType, src, title);
});

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeLightbox();
    });
  }

  // Close on backdrop click
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-backdrop")) {
      closeLightbox();
    }
  });

  // Close on Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("is-active")) {
      closeLightbox();
    }
  });
}

/* Video autoplay on scroll using IntersectionObserver */
function initAutoplayVideos() {
  const videos = document.querySelectorAll("video.autoplay-on-scroll");
  if (!videos.length || !("IntersectionObserver" in window)) return;

  const userPausedMap = new WeakMap();
  const autoPausingMap = new WeakMap();

  videos.forEach((video) => {
    userPausedMap.set(video, false);
    autoPausingMap.set(video, false);

    // Mark when user pauses while video is in view
    video.addEventListener("pause", () => {
      if (autoPausingMap.get(video)) {
        // Pause triggered by our observer
        return;
      }
      const rect = video.getBoundingClientRect();
      const fullyInView =
        rect.top >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight);
      if (fullyInView) {
        userPausedMap.set(video, true);
      }
    });

    video.addEventListener("play", () => {
      userPausedMap.set(video, false);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        const userPaused = userPausedMap.get(video);

        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!userPaused) {
            // Attempt to play, ignore failures due to browser policies
            video
              .play()
              .catch(() => {
                /* ignore autoplay failure */
              });
          }
        } else {
          if (!video.paused) {
            autoPausingMap.set(video, true);
            video.pause();
            autoPausingMap.set(video, false);
          }
        }
      });
    },
    { threshold: [0, 0.5, 1] }
  );

  videos.forEach((video) => observer.observe(video));
}

/* Org chart carousel with buttons + swipe + dots */
function initOrgCarousel() {
  const carousel = document.querySelector(".org-carousel");
  if (!carousel) return;

  const track = carousel.querySelector(".org-carousel-track");
  const slides = Array.from(track.querySelectorAll(".org-slide"));
  const prevBtn = carousel.querySelector(".org-btn.prev");
  const nextBtn = carousel.querySelector(".org-btn.next");

  if (!slides.length) return;

  let currentIndex = 0;

  // Create dots
  const dotsContainer = document.createElement("div");
  dotsContainer.className = "org-dots";
  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "org-dot" + (index === 0 ? " is-active" : "");
    dot.addEventListener("click", () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });
  carousel.appendChild(dotsContainer);

  function updateDots() {
    const dots = dotsContainer.querySelectorAll(".org-dot");
    dots.forEach((dot, idx) => {
      dot.classList.toggle("is-active", idx === currentIndex);
    });
  }

  function goToSlide(index) {
    const maxIndex = slides.length - 1;
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    const offset = -currentIndex * 100;
    track.style.transform = `translateX(${offset}%)`;
    updateDots();
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      goToSlide(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      goToSlide(currentIndex + 1);
    });
  }

  // Basic swipe support
  let startX = 0;
  let isSwiping = false;

  track.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      startX = e.touches[0].clientX;
      isSwiping = true;
    },
    { passive: true }
  );

  track.addEventListener(
    "touchend",
    (e) => {
      if (!isSwiping || !e.changedTouches.length) return;
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;
      const threshold = 50;
      if (Math.abs(deltaX) > threshold) {
        if (deltaX < 0) {
          goToSlide(currentIndex + 1);
        } else {
          goToSlide(currentIndex - 1);
        }
      }
      isSwiping = false;
    },
    { passive: true }
  );
}