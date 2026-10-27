/* Классник — общий скрипт. Подключается на всех страницах после supabase-config.js */
(function () {
  'use strict';
  var cfg = window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase;
  var sb = cfg ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
  window.klassnikSb = sb;

  // Выход: всегда ведёт на главную, даже если нет сети или сервер не ответил.
  var leaving = false;
  window.klassnikLogout = async function () {
    if (leaving) return; leaving = true;
    try { if (sb) await Promise.race([sb.auth.signOut({ scope: 'local' }), new Promise(function (r) { setTimeout(r, 2500); })]); } catch (e) { }
    try { Object.keys(localStorage).forEach(function (k) { if (/^sb-.*-auth-token/.test(k)) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) { }
    location.replace('index.html');
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-logout], #logout');
    if (b) { e.preventDefault(); b.disabled = true; b.textContent = 'Выходим…'; window.klassnikLogout(); }
  });

  // Меню на телефоне: одно меню и один обработчик на всех страницах.
  var nav = document.querySelector('.nav'), links = document.querySelector('.nav-links');
  var toggle = document.querySelector('.menu-toggle'), mm = document.querySelector('.mobile-menu');
  if (nav && links && !mm) { mm = document.createElement('div'); mm.className = 'mobile-menu'; nav.appendChild(mm); }
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  if (toggle && mm) toggle.onclick = function () { toggle.setAttribute('aria-expanded', mm.classList.toggle('open')); };

  // Шапка: если ребёнок/родитель вошёл — показываем «Кабинет» и «Выйти».
  function setNav(logged) {
    if (!links) return;
    links.querySelectorAll('.login-link').forEach(function (a) { a.remove(); });
    if (logged) {
      links.insertAdjacentHTML('beforeend', '<a class="login-link" href="dashboard.html">Кабинет</a><a class="login-link signup" href="#" data-logout>Выйти</a>');
    } else {
      links.insertAdjacentHTML('beforeend', '<a class="login-link" href="login.html">Войти</a><a class="login-link signup" href="login.html">Записаться</a>');
    }
    if (mm) {
      var base = Array.from(links.querySelectorAll('a:not(.login-link)')).map(function (a) { return a.outerHTML.replace(' active', ''); }).join('');
      mm.innerHTML = base + (logged ? '<a href="dashboard.html">Личный кабинет</a><a href="#" data-logout>Выйти</a>' : '<a href="login.html">Личный кабинет</a>');
    }
  }
  if (sb) sb.auth.getSession().then(function (r) { setNav(!!(r.data && r.data.session)); }).catch(function () { setNav(false); });
  else setNav(false);
  if (sb) sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_OUT' && /dashboard|test\.html/.test(location.pathname)) location.replace('index.html'); });

  document.addEventListener('click', async function (e) {
    if (!e.target.closest('#delMe')) return;
    if (!sb || !confirm('Удалить аккаунт и все данные ребёнка без возможности восстановления?')) return;
    var r = await sb.rpc('delete_my_account');
    if (r.error) { alert('Не получилось удалить. Напишите нам — удалим вручную.'); return; }
    window.klassnikLogout();
  });

  // Подвал с юридическими ссылками (на каждой странице).
  var legal = '<nav class="legal-links" aria-label="Документы"><a href="legal.html#privacy">Политика обработки данных</a><a href="legal.html#offer">Оферта</a><a href="legal.html#consent">Согласие на обработку данных</a><a href="legal.html#mailing">Рассылки</a><a href="legal.html#ads">Реклама</a></nav>';
  var f = document.querySelector('footer');
  if (!f) { f = document.createElement('footer'); f.textContent = 'Классник — онлайн-школа для детей. © 2026'; document.body.appendChild(f); }
  f.insertAdjacentHTML('beforeend', legal);

  // Уведомление о cookie (только технические данные входа).
  try {
    if (!localStorage.getItem('cookie-ok')) {
      var c = document.createElement('div'); c.className = 'cookie-note'; c.setAttribute('role', 'dialog');
      c.innerHTML = '<span>🍪 Сайт использует только технические cookie для входа. <a href="legal.html#privacy">Подробнее</a></span><button type="button">Понятно</button>';
      c.querySelector('button').onclick = function () { try { localStorage.setItem('cookie-ok', '1'); } catch (e) { } c.remove(); };
      document.body.appendChild(c);
    }
  } catch (e) { }

  // Анимация появления: без IntersectionObserver просто показываем блоки.
  var rv = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) { var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); } }); }, { threshold: .12 }); rv.forEach(function (e) { o.observe(e); }); }
  else rv.forEach(function (e) { e.classList.add('visible'); });
})();
