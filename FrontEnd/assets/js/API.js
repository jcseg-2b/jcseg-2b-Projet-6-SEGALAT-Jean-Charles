// ===== SECTION 1 : INITIALISATION =====
// Attends que la page HTML soit complètement chargée avant d'exécuter le code
document.addEventListener('DOMContentLoaded', async () => {
  // Adresse de l'API qui renvoie la liste des projets
  const API = 'http://localhost:5678/api/works';
  
  // Récupère la div vide "gallery" du HTML où on mettra les images
  const gallery = document.getElementById('gallery');
  
  // Si la galerie n'existe pas dans le HTML, on arrête pour éviter une erreur
  if (!gallery) return;

  // ===== SECTION 2 : FONCTION POUR CRÉER UNE FIGURE =====
  // Cette fonction fabrique un élément <figure> avec <img> + <figcaption>
  function createFigure(item) {
    // Crée la balise <figure>
    const figure = document.createElement('figure');
    
    // Crée la balise <img>
    const img = document.createElement('img');
    // Récupère l'URL de l'image (essaie plusieurs noms de clés possibles)
    img.src = item.imageUrl || item.image || item.src || '';
    // Texte alternatif si l'image ne charge pas
    img.alt = item.title || item.alt || '';
    // Les images se chargent seulement quand elles sont visibles (optimise la perf)
    img.loading = 'lazy';
    // Ajoute l'<img> dans la <figure>
    figure.appendChild(img);
    
    // Crée la balise <figcaption> (légende sous l'image)
    const figcaption = document.createElement('figcaption');
    // Met le titre du projet comme texte de la légende
    figcaption.textContent = item.title || '';
    // Ajoute la <figcaption> dans la <figure>
    figure.appendChild(figcaption);
    
    // Retourne la <figure> complète (prête à être ajoutée à la page)
    return figure;
  }

  // ===== SECTION 3 : APPEL À L'API =====
  try {
    // Envoie une requête GET à l'API et attend la réponse
    const res = await fetch(API);
    
    // Si la réponse n'est pas correcte (ex: erreur 404/500), provoque une erreur
    if (!res.ok) throw new Error('statut ' + res.status);
    
    // Transforme la réponse JSON en objet JavaScript (un tableau de projets)
    const data = await res.json();
    
    // Vérifie que data est bien un tableau, sinon provoque une erreur
    if (!Array.isArray(data)) throw new Error('réponse invalide');

    // DEBUG : affiche dans la console le contenu reçu de l'API
    console.log('data:', data);

    // ===== SECTION 4 : EXTRACTION DES CATÉGORIES =====
    // Crée un objet vide pour stocker les catégories uniques
    const categoryMap = {};
    
    // Parcourt chaque projet reçu de l'API
    data.forEach(item => {
      // Si le projet a une categoryId et qu'on l'a pas encore ajoutée
      if (item.categoryId && !categoryMap[item.categoryId]) {
        // L'ajoute dans categoryMap avec son nom
        categoryMap[item.categoryId] = item.category?.name || 'Catégorie ' + item.categoryId;
      }
    });
    
    // Transforme categoryMap en tableau d'objets { id, name }
    // Exemple : [{ id: 1, name: "Objets" }, { id: 2, name: "Appartements" }]
    const categories = Object.entries(categoryMap).map(([id, name]) => ({ id: parseInt(id), name }));

    // DEBUG : affiche les catégories trouvées dans la console
    console.log('categories:', categories);

    // ===== SECTION 5 : CRÉATION DES BOUTONS DE FILTRE =====
    // Crée une div pour contenir tous les boutons
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filters';

    // ===== BOUTON "TOUS" =====
    // Crée le bouton "Tous"
    const allBtn = document.createElement('button');
    allBtn.textContent = 'Tous';
    allBtn.className = 'filter-btn active'; // "active" = il est sélectionné au démarrage
    // Quand tu cliques sur "Tous", affiche tous les projets
    allBtn.addEventListener('click', (e) => {
      displayGallery(data, e.target);
    });
    // Ajoute le bouton "Tous" au conteneur de filtres
    filterContainer.appendChild(allBtn);

    // ===== BOUTONS PAR CATÉGORIE =====
    // Pour chaque catégorie trouvée, crée un bouton
    categories.forEach(cat => {
      // Crée un bouton
      const btn = document.createElement('button');
      // Le texte du bouton = nom de la catégorie (ex: "Objets", "Appartements")
      btn.textContent = cat.name;
      btn.className = 'filter-btn';
      // Quand tu cliques, filtre les projets pour ne montrer que ceux de cette catégorie
      btn.addEventListener('click', (e) => {
        // Crée un nouveau tableau avec seulement les projets de cette catégorie
        const filtered = data.filter(item => item.categoryId === cat.id);
        // Affiche la galerie filtrée
        displayGallery(filtered, e.target);
      });
      // Ajoute le bouton au conteneur de filtres
      filterContainer.appendChild(btn);
    });

    // ===== SECTION 6 : INSERTION DES FILTRES =====
    // Insère le conteneur de filtres juste avant la galerie dans le HTML
    gallery.parentElement.insertBefore(filterContainer, gallery);

    // ===== SECTION 7 : FONCTION D'AFFICHAGE =====
    // Cette fonction vide la galerie, ajoute les nouvelles figures et met à jour les boutons
    function displayGallery(items, btnClicked) {
      // Vide complètement la galerie (supprime les anciennes images)
      gallery.innerHTML = '';
      
      // Crée un fragment vide (conteneur en mémoire, plus rapide qu'ajouter un par un)
      const frag = document.createDocumentFragment();
      
      // Pour chaque projet dans items, crée une <figure> et l'ajoute au fragment
      items.forEach(item => frag.appendChild(createFigure(item)));
      
      // Ajoute tous les <figure> à la galerie en une seule opération
      gallery.appendChild(frag);

      // ===== MISE À JOUR DES BOUTONS =====
      // Récupère tous les boutons de filtre
      document.querySelectorAll('.filter-btn').forEach(btn => {
        // Supprime la classe "active" de tous les boutons
        btn.classList.remove('active');
      });
      // Ajoute la classe "active" au bouton cliqué (le surligne)
      if (btnClicked) btnClicked.classList.add('active');
    }

    // ===== AFFICHAGE INITIAL =====
    // Au démarrage, affiche tous les projets
    displayGallery(data, allBtn);

  // ===== GESTION DES ERREURS =====
  } catch (err) {
    // Si une erreur survient, l'affiche dans la console
    console.error('Erreur fetch:', err);
    // Affiche un message d'erreur à l'utilisateur dans la galerie
    gallery.textContent = "Impossible de charger la galerie. Vérifie la console.";
  }
});