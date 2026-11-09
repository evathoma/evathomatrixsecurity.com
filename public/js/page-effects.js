document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/') || '/';

  document.querySelectorAll('.nav-link').forEach((link) => {
    const linkPath = new URL(link.href, window.location.href).pathname.replace(/\/index\.html$/, '/') || '/';
    const isCurrentPage = linkPath === currentPath;
    link.classList.toggle('active', isCurrentPage);

    if (isCurrentPage) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  document.body.classList.add('page-transition-ready');

  document.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const link = event.target.closest('a');
    if (
      !link ||
      link.target ||
      link.hasAttribute('download') ||
      link.getAttribute('aria-disabled') === 'true'
    ) return;

    const destination = new URL(link.href, window.location.href);
    if (
      destination.origin !== window.location.origin ||
      destination.pathname === currentPath ||
      destination.pathname === window.location.pathname ||
      destination.hash && destination.pathname === window.location.pathname ||
      document.body.classList.contains('page-leaving')
    ) return;

    event.preventDefault();
    document.body.classList.add('page-leaving');
    window.setTimeout(() => window.location.assign(destination.href), 180);
  });
});
