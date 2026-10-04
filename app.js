(() => {
  const root = document.documentElement;
  root.classList.add('js-enabled');
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

  const syncThemeColor = () => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim();
  };

  themeButton?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('paperex-theme', root.dataset.theme); } catch (e) {}
    syncThemeColor();
  });
  syncThemeColor();

  if (menuButton && nav) {
    const isMobileMenu = () => getComputedStyle(menuButton).display !== 'none';
    const setMenuOpen = (open, restoreFocus = false) => {
      const mobile = isMobileMenu();
      const expanded = mobile && open;
      if (!expanded && (restoreFocus || nav.contains(document.activeElement))) {
        menuButton.focus({ preventScroll: true });
      }
      menuButton.setAttribute('aria-expanded', String(expanded));
      menuButton.setAttribute('aria-label', expanded ? '关闭菜单' : '打开菜单');
      nav.classList.toggle('is-open', expanded);
      nav.inert = mobile && !expanded;
      if (mobile && !expanded) nav.setAttribute('aria-hidden', 'true');
      else nav.removeAttribute('aria-hidden');
    };
    menuButton.addEventListener('click', () => {
      setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMenuOpen(false));
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false, true);
      }
    });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !menuButton.contains(event.target)) setMenuOpen(false);
    });
    addEventListener('resize', () => {
      setMenuOpen(menuButton.getAttribute('aria-expanded') === 'true');
    }, { passive: true });
    setMenuOpen(false);
  }

  const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 16);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const socialRoot = document.querySelector('[data-social-root]');
  if (socialRoot) {
    const numberFormatter = new Intl.NumberFormat('zh-CN');
    const setText = (selector, value) => {
      if (value === undefined || value === null) return;
      socialRoot.querySelectorAll(selector).forEach(element => {
        element.textContent = value;
      });
    };
    const loadSocialData = async () => {
      const hourlyCacheKey = Math.floor(Date.now() / 3600000);
      const socialDataPath = socialRoot.dataset.socialPath || 'data/social.json';
      const response = await fetch(`${socialDataPath}?v=${hourlyCacheKey}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Social data request failed: ${response.status}`);
      const data = await response.json();

      setText('[data-youtube-subscribers]', numberFormatter.format(data.youtube.subscribers));
      setText('[data-bilibili-followers]', numberFormatter.format(data.bilibili.followers));
      setText('[data-github-projects]', numberFormatter.format(data.github?.publicProjects));
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
  if (typewriter) {
    const phraseSources = [
      '知名形而上学大师、游戏苦手、长片之王。|创意无限！',
      '梦想终将|超越噩梦！',
      '可以根号|请勿平方！',
      '用视频，摸你心……|Touch Your Heart With Videos！',
      '给爱一个机会。|Give love a chance.',
      '关注我你将会知道|宇宙的秘辛！',
      '你也可以叫我：|PaperEX',
      '为了他人开心起来|所以一直奔跑',
      '正在不断否定：|过去的自己。',
      '穷不丧志，富不癫狂。|In poverty, lose not your resolve; in wealth, lose not your restraint.'
    ];
    const splitPhrase = source => {
      const [first, ...rest] = source.split('|');
      return [first, rest.join('|')];
    };
    const phrases = phraseSources.map(splitPhrase);
    const lines = [...typewriter.querySelectorAll('[data-type-line]')];
    let phraseIndex = 0;

    // Fit only the current phrase. Exceptionally long lines may wrap, so they
    // do not force every short slogan to use a tiny shared font size.
    const fitCurrentPhrase = () => {
      const availableWidth = typewriter.clientWidth;
      const desiredSize = parseFloat(getComputedStyle(typewriter).fontSize);
      if (!availableWidth || !desiredSize || lines.length !== 2) return;
      lines.forEach((line, lineIndex) => {
        line.style.removeProperty('font-size');
        line.classList.remove('is-wrapped');
        const probe = line.cloneNode(false);
        probe.removeAttribute('id');
        probe.removeAttribute('data-type-line');
        probe.classList.add('is-active');
        probe.setAttribute('aria-hidden', 'true');
        probe.textContent = phrases[phraseIndex][lineIndex];
        Object.assign(probe.style, {
          position: 'absolute', visibility: 'hidden', pointerEvents: 'none',
          top: '0', left: '0', width: 'max-content', maxWidth: 'none',
          whiteSpace: 'nowrap', transition: 'none', animation: 'none',
          fontSize: `${desiredSize}px`
        });
        typewriter.append(probe);
        const measuredWidth = probe.getBoundingClientRect().width;
        probe.remove();
        const singleLineSize = desiredSize * (availableWidth - 4) / (measuredWidth + desiredSize * .12);
        const minimumSize = Math.max(18, desiredSize * .42);
        const fittedSize = Math.min(desiredSize, Math.max(minimumSize, singleLineSize));
        line.style.fontSize = `${Math.floor(fittedSize * 100) / 100}px`;
        line.classList.toggle('is-wrapped', singleLineSize < minimumSize);
      });
    };
    let fitFrame = 0;
    const scheduleFit = () => {
      cancelAnimationFrame(fitFrame);
      fitFrame = requestAnimationFrame(fitCurrentPhrase);
    };
    lines.forEach((line, index) => { line.textContent = phrases[0][index]; });
    fitCurrentPhrase();
    addEventListener('resize', scheduleFit, { passive: true });
    if ('ResizeObserver' in window) {
      let previousWidth = typewriter.clientWidth;
      new ResizeObserver(() => {
        const width = typewriter.clientWidth;
        if (width !== previousWidth) {
          previousWidth = width;
          scheduleFit();
        }
      }).observe(typewriter);
    }
    document.fonts?.ready.then(scheduleFit);

    typewriter.setAttribute('aria-label', phrases[0].filter(Boolean).join(' '));

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const jitter = (min, max) => Math.round(min + Math.random() * (max - min));
    const setActiveLine = (index, deleting = false) => {
      lines.forEach((line, lineIndex) => {
        line.classList.toggle('is-active', lineIndex === index);
        line.classList.toggle('is-deleting', deleting && lineIndex === index);
      });
    };
    let heroInView = true;
    const activityWaiters = new Set();
    const canAnimate = () => !document.hidden && heroInView && !motionPreference.matches;
    const resumeAnimation = () => {
      if (!canAnimate()) return;
      activityWaiters.forEach(resolve => resolve());
      activityWaiters.clear();
    };
    const waitUntilVisible = () => canAnimate()
      ? Promise.resolve()
      : new Promise(resolve => activityWaiters.add(resolve));
    if (!motionPreference.matches) {
      document.addEventListener('visibilitychange', resumeAnimation);
      motionPreference.addEventListener('change', resumeAnimation);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
          heroInView = entries[0].isIntersecting;
          resumeAnimation();
        }).observe(typewriter);
      }
    }
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
        fitCurrentPhrase();
        await wait(jitter(260, 520));
        await typeLine(0, phrases[phraseIndex][0]);
        await wait(jitter(120, 260));
        await typeLine(1, phrases[phraseIndex][1]);
        lines.forEach(line => line.classList.remove('is-active', 'is-deleting'));
        typewriter.setAttribute('aria-label', phrases[phraseIndex].filter(Boolean).join(' '));
        await wait(jitter(2100, 3200));
      }
    };
    if (!motionPreference.matches) runTypewriter();
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    root.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -4% 0px', threshold: .02 });
    revealItems.forEach(item => observer.observe(item));
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

  const ostPlayer = document.querySelector('[data-ost-player]');
  if (ostPlayer) {
    const audio = ostPlayer.querySelector('[data-ost-audio]');
    const playButton = ostPlayer.querySelector('[data-ost-play]');
    const progress = ostPlayer.querySelector('[data-ost-progress]');
    const title = ostPlayer.querySelector('[data-ost-title]');
    const time = ostPlayer.querySelector('[data-ost-time]');
    const tracks = document.querySelectorAll('[data-ost-track]');
    const status = document.createElement('p');
    status.className = 'ost-player-status';
    status.setAttribute('role', 'status');
    status.hidden = true;
    ostPlayer.after(status);
    let currentTrack = null;
    const clearStatus = () => {
      status.textContent = '';
      status.hidden = true;
    };
    const showPlaybackError = () => {
      status.textContent = '音乐暂时无法播放，请稍后重试。';
      status.hidden = false;
    };
    const formatTime = seconds => {
      if (!Number.isFinite(seconds)) return '00:00';
      const minutes = Math.floor(seconds / 60);
      const remainder = Math.floor(seconds % 60);
      return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
    };
    const syncPlayer = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      progress.value = duration ? String((audio.currentTime / duration) * 100) : '0';
      progress.setAttribute('aria-valuetext', `已播放 ${formatTime(audio.currentTime)}，共 ${formatTime(duration)}`);
      time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(duration)}`;
      playButton.querySelector('span').textContent = audio.paused ? '▶' : 'Ⅱ';
      playButton.setAttribute('aria-label', audio.paused ? '播放' : '暂停');
      tracks.forEach(track => {
        const selected = track === currentTrack;
        const playing = selected && !audio.paused;
        track.classList.toggle('is-active', selected);
        if (selected) track.setAttribute('aria-current', 'true');
        else track.removeAttribute('aria-current');
        track.setAttribute('aria-label', `${playing ? '暂停' : '播放'} ${track.dataset.ostTitle || ''}`.trim());
        const icon = track.querySelector('.ost-track-play');
        if (icon) icon.textContent = playing ? 'Ⅱ' : '▶';
      });
    };
    const playAudio = async () => {
      const source = audio.getAttribute('src');
      clearStatus();
      try {
        await audio.play();
      } catch (error) {
        if (error.name !== 'AbortError' && audio.getAttribute('src') === source) showPlaybackError();
      }
      syncPlayer();
    };
    const selectTrack = async (track, autoplay = false) => {
      const source = track.dataset.ostSrc;
      if (!source) return;
      const wasPlaying = track === currentTrack && !audio.paused;
      currentTrack = track;
      if (audio.getAttribute('src') !== source) {
        clearStatus();
        audio.src = source;
        title.textContent = track.dataset.ostTitle || track.textContent.trim();
        playButton.disabled = false;
        progress.disabled = false;
      }
      if (autoplay) {
        if (wasPlaying) audio.pause();
        else await playAudio();
      }
      syncPlayer();
    };
    tracks.forEach(track => track.addEventListener('click', () => selectTrack(track, true)));
    playButton.addEventListener('click', () => {
      if (!audio.src) return;
      if (audio.paused) playAudio();
      else audio.pause();
    });
    progress.addEventListener('input', () => {
      if (audio.duration) audio.currentTime = audio.duration * Number(progress.value) / 100;
      syncPlayer();
    });
    audio.addEventListener('timeupdate', syncPlayer);
    audio.addEventListener('loadedmetadata', syncPlayer);
    audio.addEventListener('play', () => {
      clearStatus();
      syncPlayer();
    });
    audio.addEventListener('error', showPlaybackError);
    audio.addEventListener('pause', syncPlayer);
    audio.addEventListener('ended', syncPlayer);
    if (tracks.length) selectTrack(tracks[0]);
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
