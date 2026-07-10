/* =========================================================
   ENZA E BASTA — CMS content loader
   Fetches content/site.json, content/blog.json, content/courses.json
   (edited via /admin) and renders them into the page. Falls back to
   the static markup already in index.html if a fetch fails.
   ========================================================= */
(function () {
  'use strict';

  function currentLang() {
    return document.body.getAttribute('data-lang') || 'it';
  }

  function pick(obj, key) {
    var lang = currentLang();
    return (obj && obj[key + '_' + lang]) || (obj && obj[key + '_it']) || '';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fetchJson(path) {
    return fetch(path, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  var state = { site: null, blog: null, courses: null };

  function renderSite() {
    var s = state.site;
    if (!s) return;
    var map = {
      heroPhotoImg: s.hero_image,
      chiSonoPhotoImg: s.chi_sono_image,
      corsiPhotoImg: s.corsi_image
    };
    Object.keys(map).forEach(function (id) {
      var src = map[id];
      if (!src) return;
      var img = document.getElementById(id);
      if (img) img.src = src;
    });
  }

  function cardHtml(title, text, image, metaLine) {
    var img = image
      ? '<div class="card-img"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(title) + '" loading="lazy" /></div>'
      : '';
    var meta = metaLine ? '<p>' + escapeHtml(metaLine) + '</p>' : '';
    return '<article class="card">' + img +
      '<div class="card-body"><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(text) + '</p>' + meta + '</div>' +
      '</article>';
  }

  function renderBlog() {
    var section = document.getElementById('blog');
    var wrap = document.getElementById('blogCards');
    if (!section || !wrap) return;
    var posts = (state.blog && state.blog.posts) || [];
    if (!posts.length) { section.hidden = true; return; }

    wrap.innerHTML = posts.map(function (p) {
      return cardHtml(pick(p, 'title'), pick(p, 'body'), p.image);
    }).join('');
    section.hidden = false;
  }

  function renderCourses() {
    var wrap = document.getElementById('corsiCards');
    if (!wrap) return;
    var courses = (state.courses && state.courses.courses) || [];
    if (!courses.length) { wrap.hidden = true; return; }

    wrap.innerHTML = courses.map(function (c) {
      var meta = [c.schedule, c.price].filter(Boolean).join(' · ');
      return cardHtml(pick(c, 'title'), pick(c, 'description'), c.image, meta);
    }).join('');
    wrap.hidden = false;
  }

  fetchJson('content/site.json').then(function (d) { state.site = d; renderSite(); });
  fetchJson('content/blog.json').then(function (d) { state.blog = d; renderBlog(); });
  fetchJson('content/courses.json').then(function (d) { state.courses = d; renderCourses(); });

  document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      renderBlog();
      renderCourses();
    });
  });
})();
