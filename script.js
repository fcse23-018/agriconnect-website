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
})();
