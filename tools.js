let tools = [];
const grid = document.getElementById('grid');
const search = document.getElementById('search');
const category = document.getElementById('category');

fetch('tools.json')
  .then(r => r.json())
  .then(data => {
    tools = data;
    [...new Set(tools.map(t => t.category))].sort().forEach(c => {
      category.add(new Option(c, c));
    });
    render();
  })
  .catch(() => {
    grid.textContent = 'Could not load tools.json';
  });

function render() {
  const q = search.value.trim().toLowerCase();
  const c = category.value;
  const list = tools.filter(t =>
    (!c || t.category === c) &&
    (!q || [t.name, t.description, ...t.tags].join(' ').toLowerCase().includes(q))
  );
  grid.innerHTML = list.length
    ? list.map(t => `
      <article class="card">
        <h3>${t.name}</h3>
        <small>${t.category} · ${t.pricing}</small>
        <p>${t.description}</p>
        <a href="${t.url}" target="_blank" rel="noopener">Visit</a>
      </article>`).join('')
    : '<p>No tools found.</p>';
}

search.addEventListener('input', render);
category.addEventListener('change', render);