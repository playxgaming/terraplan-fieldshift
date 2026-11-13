import { ROUTES, resolveRoute, renderNotFound } from './views.mjs';
import { openGlossary } from './glossary.mjs';

const app = document.getElementById('app');
const navigation = document.getElementById('primary-nav');
const menuButton = document.getElementById('menu-toggle');
const desktop = window.matchMedia('(min-width: 54rem)');
let menuOpen = false;

function syncMenu() {
  navigation.hidden = !desktop.matches && !menuOpen;
  menuButton.hidden = desktop.matches;
  menuButton.setAttribute('aria-expanded', String(!navigation.hidden));
  menuButton.textContent = menuOpen ? 'Close menu' : 'Menu';
}

function render({ focus = false } = {}) {
  const route = resolveRoute(window.location.hash);
  navigation.innerHTML = ROUTES.map(item => `<a href="#${item.path}"${route?.path === item.path ? ' aria-current="page"' : ''}>${item.label}</a>`).join('');
  app.innerHTML = route ? route.render() : renderNotFound();
  document.title = `TerraPlan V3 · ${route?.label ?? 'Page not found'}`;
  menuOpen = false;
  syncMenu();
  if (focus) {
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }
}

menuButton.addEventListener('click', () => {
  menuOpen = !menuOpen;
  syncMenu();
});

desktop.addEventListener('change', () => {
  const moveFocus = !desktop.matches && navigation.contains(document.activeElement);
  menuOpen = false;
  syncMenu();
  if (moveFocus) menuButton.focus();
});

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  app.focus();
});

document.addEventListener('click', event => {
  const glossary = event.target.closest('[data-glossary]');
  if (glossary) openGlossary(glossary.dataset.glossary);
  const action = event.target.closest('[data-navigate]');
  if (action) {
    const nextHash = `#${action.dataset.navigate}`;
    if (window.location.hash === nextHash) render({ focus: true });
    else window.location.hash = nextHash;
  }
});

document.getElementById('glossary-close').addEventListener('click', () => {
  document.getElementById('glossary-dialog').close();
});

window.addEventListener('hashchange', () => render({ focus: true }));
render();
