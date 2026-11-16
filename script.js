/* AgriConnect download site — progressive enhancement only.
   Everything on the page works without this file. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  /* --- Sticky header ----- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --- Reveal on scroll ----- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 60) + 'ms';
      io.observe(el);
    });

    /* Safety net: never leave content invisible if the observer misbehaves. */
    window.setTimeout(function () {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }, 4000);
  }

  /* --- Footer year ----- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  /* --- Live APK size (works on a server; silently skipped on file://) --- */
  var apk = document.querySelector('a[download][href$=".apk"]');
  function formatSize(bytes) {
    var mb = bytes / (1024 * 1024);
    return (mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10) + ' MB';
  }
  function paintSizes(text) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-apk-size]'), function (el) {
      el.textContent = text;
    });
  }
  if (apk && window.fetch) {
    fetch(apk.getAttribute('href'), { method: 'HEAD' })
      .then(function (res) {
        var len = res.headers.get('content-length');
        if (!res.ok || !len) throw new Error('no size');
        paintSizes(formatSize(parseInt(len, 10)));
      })
      .catch(function () { /* keep the static fallback */ });
  }

  /* --- Copy page link ----- */
  var toast = document.querySelector('[data-toast]');
  var toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('show');
    }, 2400);
  }

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy-link]'), function (btn) {
    btn.addEventListener('click', function () {
      var url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          showToast('Link copied to clipboard');
        }).catch(function () {
          showToast(legacyCopy(url) ? 'Link copied to clipboard' : url);
        });
      } else {
        showToast(legacyCopy(url) ? 'Link copied to clipboard' : url);
      }
    });
  });

  /* --- Live release status from the Render API ---------------------
     The site works with or without this: if the API cannot be reached
     (offline, CORS not configured yet), every button keeps the bundled
     APK that is already in assets/. */
  var RENDER_VERSION_URL = 'https://agriconnect-api-f55x.onrender.com/api/v1/app/version';
  var statusBox = document.querySelector('[data-release-status]');
  if (statusBox && window.fetch) {
    var title = statusBox.querySelector('[data-release-title]');
    var detail = statusBox.querySelector('[data-release-detail]');

    function useBundled(message) {
      if (title) title.textContent = 'Using the bundled APK';
      if (detail) detail.textContent = message;
    }

    var controller = window.AbortController ? new AbortController() : null;
    var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, 6000);

    fetch(RENDER_VERSION_URL, controller ? { signal: controller.signal } : {})
      .then(function (res) { if (!res.ok) throw new Error('http'); return res.json(); })
      .then(function (release) {
        window.clearTimeout(timeout);
        if (!release || !release.available || !release.downloadUrl) {
          useBundled('No release published on Render yet — the buttons use the bundled v1.2.1 APK.');
          return;
        }

        // Never let a lagging API manifest point the download buttons at an
        // older APK than the one bundled on this site.
        if (Number(release.latestVersionCode) < 5) {
          useBundled('The bundled v1.2.1 APK is newer than the API manifest (v' +
            (release.latestVersionName || '?') + ').');
          return;
        }

        statusBox.classList.add('is-live');
        if (title) title.textContent = 'Latest release: v' + (release.latestVersionName || '?');
        var bits = [];
        if (Array.isArray(release.releaseNotes) && release.releaseNotes.length) {
          bits.push(release.releaseNotes.join(' · '));
        } else if (release.releasedAt) {
          bits.push('Published ' + release.releasedAt);
        } else {
          bits.push('Download links now follow this release.');
        }
        if (release.sizeBytes) bits.push(formatSize(Number(release.sizeBytes)));
        if (detail) detail.textContent = bits.join(' · ');

        // Keep the website and the app on the same release.
        Array.prototype.forEach.call(document.querySelectorAll('a[download][href$=".apk"]'), function (a) {
          a.setAttribute('href', release.downloadUrl);
        });
      })
      .catch(function () {
        window.clearTimeout(timeout);
        useBundled('The buttons use the bundled v1.2.1 APK hosted on this site.');
      });
  }
})();
