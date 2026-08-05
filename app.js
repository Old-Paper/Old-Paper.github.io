(() => {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const themeButton = document.querySelector('[data-theme-toggle]');

  const syncThemeColor = () => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = root.dataset.theme === 'light' ? '#f2f0e8' : '#11110f';
  };

  themeButton?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('paperex-theme', root.dataset.theme); } catch (e) {}
    syncThemeColor();
  });
  syncThemeColor();

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menuButton.setAttribute('aria-label', open ? '打开菜单' : '关闭菜单');
    nav?.classList.toggle('is-open', !open);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 16);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealItems.forEach(item => observer.observe(item));
    // Keep content visible even when a browser restores a deep scroll position
    // before IntersectionObserver has delivered its first entries.
    setTimeout(() => revealItems.forEach(item => item.classList.add('is-visible')), 1200);
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  const filters = document.querySelectorAll('[data-filter]');
  const posts = document.querySelectorAll('[data-category]');
  const emptyState = document.querySelector('[data-empty-state]');
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filters.forEach(item => item.classList.toggle('is-active', item === button));
    let visible = 0;
    posts.forEach(post => {
      const show = filter === 'all' || post.dataset.category === filter;
      post.hidden = !show;
      if (show) visible += 1;
    });
    if (emptyState) emptyState.hidden = visible !== 0;
  }));

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
