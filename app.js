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

  const socialRoot = document.querySelector('[data-social-root]');
  if (socialRoot) {
    const numberFormatter = new Intl.NumberFormat('zh-CN');
    const setText = (selector, value) => {
      const element = socialRoot.querySelector(selector);
      if (element && value !== undefined && value !== null) element.textContent = value;
    };
    const loadSocialData = async () => {
      const hourlyCacheKey = Math.floor(Date.now() / 3600000);
      const response = await fetch(`data/social.json?v=${hourlyCacheKey}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Social data request failed: ${response.status}`);
      const data = await response.json();

      setText('[data-youtube-subscribers]', numberFormatter.format(data.youtube.subscribers));
      setText('[data-bilibili-followers]', numberFormatter.format(data.bilibili.followers));
      setText('[data-latest-video-title]', data.youtube.latestVideo.title);

      const videoLink = socialRoot.querySelector('[data-latest-video]');
      const videoThumbnail = socialRoot.querySelector('[data-latest-video-thumbnail]');
      if (videoLink) videoLink.href = data.youtube.latestVideo.url;
      if (videoThumbnail) {
        videoThumbnail.src = data.youtube.latestVideo.thumbnail;
        videoThumbnail.alt = `${data.youtube.latestVideo.title}的视频封面`;
      }
      const status = socialRoot.querySelector('[data-social-status]');
      if (status) {
        status.textContent = '每小时同步';
        status.title = `数据更新于 ${new Date(data.updatedAt).toLocaleString('zh-CN')}`;
      }
    };
    loadSocialData().catch(() => {
      const status = socialRoot.querySelector('[data-social-status]');
      if (status) status.textContent = '暂用缓存';
    });
  }

  const typewriter = document.querySelector('[data-typewriter]');
  if (typewriter && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const phraseSources = [
      '知名形而上学大师、游戏苦手、长片之王。|创意无限！',
      '梦想终将|超越噩梦！',
      '可以根号|请勿平方！',
      '用视频，摸你心……|Touch Your Heart With Videos！',
      '搞砸一个机会。|Give Fuck a chance.',
      '关注我你将会知道|宇宙的秘辛！',
      '希望你能喜欢，|今后我会越走越高~',
      '你也可以叫我：|PaperEX',
      '为了他人开心起来|所以一直奔跑'
    ];
    const splitLongFirstLine = source => {
      const [first, ...rest] = source.split('|');
      const second = rest.join('|');
      const firstCharacters = Array.from(first);
      if (firstCharacters.length <= 12) return [first, second];
      const characters = [...firstCharacters, ...Array.from(second)];
      const punctuation = new Set('，。！？；：、~…');
      const target = characters.length / 2;
      const candidates = characters
        .map((character, index) => punctuation.has(character) ? index + 1 : -1)
        .filter(index => index >= 4 && index < characters.length - 3);
      const boundary = candidates.length
        ? candidates.reduce((best, index) => Math.abs(index - target) < Math.abs(best - target) ? index : best, candidates[0])
        : Math.round(target);
      return [characters.slice(0, boundary).join(''), characters.slice(boundary).join('')];
    };
    const phrases = phraseSources.map(splitLongFirstLine);
    const lines = [...typewriter.querySelectorAll('[data-type-line]')];
    let phraseIndex = 0;

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const jitter = (min, max) => Math.round(min + Math.random() * (max - min));
    const setActiveLine = (index, deleting = false) => {
      lines.forEach((line, lineIndex) => {
        line.classList.toggle('is-active', lineIndex === index);
        line.classList.toggle('is-deleting', deleting && lineIndex === index);
      });
    };
    const waitUntilVisible = async () => {
      while (document.hidden) await wait(250);
    };
    const chooseNextPhrase = () => {
      if (phrases.length < 2) return 0;
      let next = phraseIndex;
      while (next === phraseIndex) next = Math.floor(Math.random() * phrases.length);
      return next;
    };
    const typeLine = async (lineIndex, content) => {
      setActiveLine(lineIndex);
      const characters = Array.from(content);
      lines[lineIndex].textContent = '';
      for (const character of characters) {
        await waitUntilVisible();
        lines[lineIndex].textContent += character;
        await wait(jitter(72, 128));
      }
    };
    const deleteLine = async lineIndex => {
      setActiveLine(lineIndex, true);
      const characters = Array.from(lines[lineIndex].textContent);
      while (characters.length) {
        await waitUntilVisible();
        characters.pop();
        lines[lineIndex].textContent = characters.join('');
        await wait(jitter(32, 62));
      }
    };
    const runTypewriter = async () => {
      await wait(2200);
      while (true) {
        await deleteLine(1);
        await wait(120);
        await deleteLine(0);
        phraseIndex = chooseNextPhrase();
        await wait(jitter(260, 520));
        await typeLine(0, phrases[phraseIndex][0]);
        await wait(jitter(120, 260));
        await typeLine(1, phrases[phraseIndex][1]);
        lines.forEach(line => line.classList.remove('is-active', 'is-deleting'));
        typewriter.setAttribute('aria-label', phrases[phraseIndex].filter(Boolean).join(' '));
        await wait(jitter(2100, 3200));
      }
    };
    runTypewriter();
  }

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
