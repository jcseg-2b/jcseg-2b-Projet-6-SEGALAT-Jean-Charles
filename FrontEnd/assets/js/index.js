document.addEventListener('DOMContentLoaded', async () => {
  const API = 'http://localhost:5678/api/works';
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  function createFigure(item) {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = item.imageUrl || item.image || item.src || '';
    img.alt = item.title || item.alt || '';
    img.loading = 'lazy';
    figure.appendChild(img);
    const figcaption = document.createElement('figcaption');
    figcaption.textContent = item.title || '';
    figure.appendChild(figcaption);
    return figure;
  }

  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('statut ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('réponse invalide');

    console.log('data:', data); // DEBUG : vérifie ce que tu reçois

    // récupère les catégories uniques simplement
    const categoryMap = {};
    data.forEach(item => {
      if (item.categoryId && !categoryMap[item.categoryId]) {
        categoryMap[item.categoryId] = item.category?.name || 'Catégorie ' + item.categoryId;
      }
    });
    const categories = Object.entries(categoryMap).map(([id, name]) => ({ id: parseInt(id), name }));

    console.log('categories:', categories); // DEBUG

    // crée les boutons de filtre
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filters';

    // bouton "Tous"
    const allBtn = document.createElement('button');
    allBtn.textContent = 'Tous';
    allBtn.className = 'filter-btn active';
    allBtn.addEventListener('click', (e) => {
      displayGallery(data, e.target);
    });
    filterContainer.appendChild(allBtn);

    // boutons par catégorie
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat.name;
      btn.className = 'filter-btn';
      btn.addEventListener('click', (e) => {
        const filtered = data.filter(item => item.categoryId === cat.id);
        displayGallery(filtered, e.target);
      });
      filterContainer.appendChild(btn);
    });

    // insère les filtres avant la galerie
    gallery.parentElement.insertBefore(filterContainer, gallery);

    // fonction pour afficher la galerie
    function displayGallery(items, btnClicked) {
      gallery.innerHTML = ''; // vide la galerie
      const frag = document.createDocumentFragment();
      items.forEach(item => frag.appendChild(createFigure(item)));
      gallery.appendChild(frag);

      // met à jour l'état des boutons
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      if (btnClicked) btnClicked.classList.add('active');
    }

    // affiche tous les projets au démarrage
    displayGallery(data, allBtn);

  } catch (err) {
    console.error('Erreur fetch:', err);
    gallery.textContent = "Impossible de charger la galerie. Vérifie la console.";
  }
});