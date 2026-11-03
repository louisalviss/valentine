/* SiteOps AI illustrative review queue. No network, no writes. */
(() => {
  const examples = {
    performance: {
      type: 'Performance / sample',
      priority: 'High review',
      title: 'Hero asset heavier than needed',
      desc: 'Inspect the template and image delivery path, estimate impact, then propose a change for approval.'
    },
    seo: {
      type: 'Technical SEO / sample',
      priority: 'Medium review',
      title: 'Internal links miss service page',
      desc: 'Review the internal link graph and recommend relevant paths before changing any navigation.'
    },
    content: {
      type: 'Content / sample',
      priority: 'Medium review',
      title: 'Positioning drift on two pages',
      desc: 'Compare the service messaging with current page copy, then prepare proposed revisions for review.'
    },
    maintenance: {
      type: 'Maintenance / sample',
      priority: 'Review needed',
      title: 'Plugin update needs compatibility review',
      desc: 'Check plugin compatibility and rollback requirements before scheduling any change.'
    }
  };
  const rows = [...document.querySelectorAll('[data-finding]')];
  const typeEl = document.getElementById('finding-type');
  const priorityEl = document.getElementById('finding-priority');
  const titleEl = document.getElementById('finding-title');
  const descEl = document.getElementById('finding-desc');
  const gateEl = document.getElementById('finding-gate');
  for (const row of rows) {
    row.addEventListener('click', () => {
      const item = examples[row.dataset.finding];
      if (!item) return;
      for (const r of rows) r.setAttribute('aria-pressed', String(r === row));
      typeEl.textContent = item.type;
      priorityEl.textContent = item.priority;
      titleEl.textContent = item.title;
      descEl.textContent = item.desc;
      gateEl.textContent = 'Locked until human approval';
    });
  }
})();
