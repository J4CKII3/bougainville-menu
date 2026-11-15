(() => {
  'use strict';

  const config = window.BougainvilleMenu;
  const menuPages = validateConfig(config);
  const pages = [
    { id: 'bienvenue', type: 'welcome', label: 'Bienvenue' },
    { id: 'couverture', type: 'cover', label: 'Couverture' },
    ...menuPages.map(page => ({ ...page, label: page.title, type: 'pdf' }))
  ];
  const pageIndex = new Map(pages.map((page, index) => [page.id, index]));
  const leafCount = Math.ceil(pages.length / 2);
  const maxFrame = Math.ceil((pages.length - 1) / 2);
  const pageTurnStaggerMs = 22;
  const maxPageTurnStaggerMs = 88;
  const stage = document.querySelector('#stage');
  const world = document.querySelector('#world');
  const book = document.querySelector('#book');
  const previousButton = document.querySelector('#pagePrev');
  const nextButton = document.querySelector('#pageNext');
  let pageNumber = 0;
  let frameNumber = 0;
  let spread = false;
  let pageWidth = 0;
  let pageHeight = 0;
  let leaves = [];
  let faces = [];

  function validateConfig(value) {
    if (!value || !Array.isArray(value.pages) || value.pages.length === 0) {
      throw new Error('Menu configuration must include at least one PDF page.');
    }

    const imageName = /^[\w.-]+\.(?:jpe?g|png|webp)$/i;
    if (!/^[\w.-]+\.pdf$/i.test(value.pdf || '') ||
        !imageName.test(value.welcome?.mainPhoto || '') ||
        !imageName.test(value.welcome?.detailPhoto || '') ||
        !imageName.test(value.cover?.background || '') ||
        !value.cover?.brand || !value.cover?.subtitle) {
      throw new Error('Menu configuration is missing a required asset or label.');
    }

    const ids = new Set(['bienvenue', 'couverture']);
    for (const page of value.pages) {
      if (!page || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.id || '') ||
          typeof page.title !== 'string' || !page.title.trim() ||
          !imageName.test(page.image || '')) {
        throw new Error('Every menu page needs a valid id, title, and image filename.');
      }
      if (ids.has(page.id)) throw new Error(`Duplicate menu page id: ${page.id}`);
      ids.add(page.id);
    }
    return value.pages;
  }

  function createWelcomePage() {
    const section = document.createElement('section');
    section.className = 'face front welcome';
    section.setAttribute('role', 'region');
    section.setAttribute('aria-roledescription', 'page');
    section.setAttribute('aria-label', 'Page 1 : Bienvenue');

    const mainPhoto = document.createElement('img');
    mainPhoto.className = 'welcome-photo welcome-main';
    mainPhoto.src = config.welcome.mainPhoto;
    mainPhoto.alt = 'Enseigne illuminée du Bougainville Café Lounge';
    mainPhoto.draggable = false;

    const detailPhoto = document.createElement('img');
    detailPhoto.className = 'welcome-photo welcome-detail';
    detailPhoto.src = config.welcome.detailPhoto;
    detailPhoto.alt = 'Entrée du Bougainville Café Lounge';
    detailPhoto.draggable = false;

    const shade = document.createElement('div');
    shade.className = 'welcome-shade';
    shade.setAttribute('aria-hidden', 'true');

    const copy = document.createElement('div');
    copy.className = 'welcome-copy';
    copy.innerHTML = '<p class="welcome-kicker">Café Lounge</p><h1 class="welcome-title">Bienvenue</h1><p class="welcome-since">Depuis 2011</p>';
    section.append(mainPhoto, detailPhoto, shade, copy);
    return section;
  }

  function createCoverPage() {
    const section = document.createElement('section');
    section.className = 'face back cover';
    section.setAttribute('role', 'region');
    section.setAttribute('aria-roledescription', 'page');
    section.setAttribute('aria-label', 'Page 2 : Couverture');

    const background = document.createElement('img');
    background.className = 'cover-photo';
    background.src = config.cover.background;
    background.alt = '';
    background.setAttribute('aria-hidden', 'true');
    background.draggable = false;

    const frame = document.createElement('div');
    frame.className = 'cover-frame';
    frame.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    content.className = 'cover-content';
    content.innerHTML = `<p class="cover-since">Depuis 2011</p><h2 class="cover-brand">${escapeHtml(config.cover.brand)}</h2><p class="cover-subtitle">${escapeHtml(config.cover.subtitle)}</p><div class="cover-rule" aria-hidden="true"></div>`;

    const links = document.createElement('ol');
    links.className = 'cover-links';
    menuPages.forEach((menuPage, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.className = 'cover-link';
      button.type = 'button';
      button.dataset.go = menuPage.id;
      button.setAttribute('aria-label', `Ouvrir la page ${index + 1} : ${menuPage.title}`);
      button.innerHTML = `<span class="cover-page-number">p.${index + 3}</span><span><b class="cover-link-title">${escapeHtml(menuPage.title)}</b><small class="cover-link-subtitle">Menu original · page ${index + 1}</small></span>`;
      item.append(button);
      links.append(item);
    });

    const pdfLink = document.createElement('a');
    pdfLink.className = 'cover-pdf';
    pdfLink.href = config.pdf;
    pdfLink.target = '_blank';
    pdfLink.rel = 'noopener';
    pdfLink.textContent = 'Ouvrir le PDF original';

    const prompt = document.createElement('p');
    prompt.className = 'cover-prompt';
    prompt.textContent = config.cover.prompt || 'Utilisez les flèches pour tourner la page';
    content.append(links, pdfLink, prompt);
    section.append(background, frame, content);
    return section;
  }

  function createPdfPage(page, index, side) {
    const section = document.createElement('section');
    section.className = `face ${side} pdf-page`;
    section.setAttribute('role', 'region');
    section.setAttribute('aria-roledescription', 'page');
    section.setAttribute('aria-label', `Page ${index + 1} : ${page.label}`);

    const image = document.createElement('img');
    image.className = 'pdf-menu-page';
    image.src = `menu-assets/${page.image}`;
    image.alt = `${page.label} · page ${index - 1} du menu original`;
    image.draggable = false;
    image.addEventListener('error', () => {
      const message = document.createElement('div');
      message.className = 'page-error';
      message.setAttribute('role', 'img');
      message.setAttribute('aria-label', `Impossible de charger ${page.image}`);
      message.innerHTML = `<strong>${escapeHtml(page.label)}</strong><span>La page du menu n’est pas disponible.</span><a href="${escapeHtml(config.pdf)}" target="_blank" rel="noopener">Ouvrir le PDF original</a>`;
      image.replaceWith(message);
    }, { once: true });

    section.append(image);
    return section;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function createFace(index, side) {
    if (index >= pages.length) {
      const blank = document.createElement('div');
      blank.className = `face ${side} blank`;
      blank.setAttribute('aria-hidden', 'true');
      return blank;
    }

    if (index === 0) return createWelcomePage();
    if (index === 1) return createCoverPage();
    return createPdfPage(pages[index], index, side);
  }

  function buildBook() {
    const rightStack = document.createElement('div');
    rightStack.className = 'stack stack-right';
    const leftStack = document.createElement('div');
    leftStack.className = 'stack stack-left';
    book.replaceChildren(rightStack, leftStack);
    leaves = [];
    faces = [];

    for (let leafIndex = 0; leafIndex < leafCount; leafIndex += 1) {
      const leaf = document.createElement('div');
      leaf.className = 'leaf';
      const frontIndex = leafIndex * 2;
      const backIndex = frontIndex + 1;
      const front = createFace(frontIndex, 'front');
      const back = createFace(backIndex, 'back');
      faces[frontIndex] = front;
      faces[backIndex] = back;
      leaf.append(front, back);
      book.append(leaf);
      leaves.push(leaf);
    }

    stage.style.setProperty('--backdrop', `url("${config.cover.background}")`);
  }

  function layout() {
    const width = innerWidth;
    const height = innerHeight;
    const compactLandscape = width > height && height < 500;

    if (compactLandscape) {
      spread = true;
      pageWidth = Math.round(Math.min((width - 24) / 2, 460));
      pageHeight = height - 76;
    } else {
      let candidateWidth = Math.min((height - 118) * .68, (width - 56) / 2, 560);
      let candidateHeight = candidateWidth / .68;
      spread = candidateWidth >= 290 && candidateHeight >= 640;
      if (!spread) {
        candidateWidth = Math.min(width - 24, 500);
        candidateHeight = Math.max(300, Math.min(height - 112, candidateWidth * 1.95));
      }
      pageWidth = Math.round(candidateWidth);
      pageHeight = Math.round(candidateHeight);
    }

    world.style.setProperty('--page-width', `${pageWidth}px`);
    world.style.setProperty('--page-height', `${pageHeight}px`);
    stage.classList.toggle('is-wide', spread);
  }

  function render(previousFrame, instant = false) {
    if (instant) stage.classList.add('no-anim');
    stage.classList.toggle('is-front', frameNumber === 0);

    const movingForward = frameNumber > previousFrame;
    const span = Math.abs(frameNumber - previousFrame);
    leaves.forEach((leaf, index) => {
      const flipped = index < frameNumber;
      let delay = 0;
      if (!instant && span > 1) {
        if (movingForward && index >= previousFrame && index < frameNumber) {
          delay = Math.min((index - previousFrame) * pageTurnStaggerMs, maxPageTurnStaggerMs);
        } else if (!movingForward && index >= frameNumber && index < previousFrame) {
          delay = Math.min((previousFrame - 1 - index) * pageTurnStaggerMs, maxPageTurnStaggerMs);
        }
      }
      leaf.style.setProperty('--turn-delay', `${delay}ms`);
      leaf.classList.toggle('flipped', flipped);
      leaf.style.transform = `translateZ(${flipped ? (index + 1) * 2 : (leafCount - index) * 2}px) rotateY(${flipped ? -180 : 0}deg)`;
    });

    let shift = -pageWidth / 2;
    if (frameNumber > 0) shift = spread ? 0 : (pageNumber % 2 === 1 ? pageWidth / 2 : -pageWidth / 2);
    world.style.setProperty('--page-shift', `${shift}px`);
    world.style.setProperty('--shadow-width', `${spread && frameNumber > 0 ? pageWidth * 1.8 : pageWidth * .92}px`);
    book.style.setProperty('--right-pages', String(leafCount - frameNumber));
    book.style.setProperty('--left-pages', String(frameNumber));

    const currentPages = new Set();
    if (spread) {
      if (frameNumber > 0 && frameNumber * 2 - 1 < pages.length) currentPages.add(frameNumber * 2 - 1);
      if (frameNumber * 2 < pages.length) currentPages.add(frameNumber * 2);
    } else {
      currentPages.add(pageNumber);
    }

    faces.forEach((face, index) => {
      const visible = currentPages.has(index);
      face.classList.toggle('is-current', visible);
      face.inert = !visible;
      face.setAttribute('aria-hidden', String(!visible));
    });
    previousButton.disabled = spread ? frameNumber === 0 : pageNumber === 0;
    nextButton.disabled = spread ? frameNumber >= maxFrame : pageNumber >= pages.length - 1;

    const activePage = pages[pageNumber];
    if (location.hash !== `#${activePage.id}`) {
      history.replaceState(null, '', `#${activePage.id}`);
    }
    if (instant) {
      void stage.offsetWidth;
      requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('no-anim')));
    }
  }

  function goTo(index, instant = false) {
    const nextPage = Math.max(0, Math.min(pages.length - 1, index));
    const previousFrame = frameNumber;
    pageNumber = nextPage;
    frameNumber = Math.ceil(pageNumber / 2);
    render(previousFrame, instant);
  }

  function next() {
    if (spread) {
      if (frameNumber < maxFrame) goTo(Math.min(2 * (frameNumber + 1) - 1, pages.length - 1));
    } else {
      goTo(pageNumber + 1);
    }
  }

  function previous() {
    if (spread) {
      if (frameNumber > 0) goTo(frameNumber === 1 ? 0 : 2 * (frameNumber - 1) - 1);
    } else {
      goTo(pageNumber - 1);
    }
  }

  buildBook();
  layout();

  previousButton.addEventListener('click', previous);
  nextButton.addEventListener('click', next);
  stage.addEventListener('click', event => {
    const target = event.target.closest('[data-go]');
    if (!target) return;
    const index = pageIndex.get(target.dataset.go);
    if (index !== undefined) goTo(index);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') next();
    if (event.key === 'ArrowLeft') previous();
  });
  addEventListener('hashchange', () => {
    const index = pageIndex.get(location.hash.slice(1));
    if (index !== undefined && index !== pageNumber) goTo(index);
  });
  addEventListener('resize', () => {
    const compactLandscape = innerWidth > innerHeight && innerHeight < 500;
    if (compactLandscape !== (document.documentElement.dataset.compactLandscape === 'true')) {
      location.reload();
      return;
    }
    layout();
    render(frameNumber, true);
  });

  document.documentElement.dataset.compactLandscape = String(innerWidth > innerHeight && innerHeight < 500);
  const startPage = pageIndex.get(location.hash.slice(1));
  goTo(startPage === undefined ? 0 : startPage, true);
})();
