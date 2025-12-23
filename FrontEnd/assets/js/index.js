// ========================================
// ÉTAPE 1 : Attendre que la page soit prête
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  // Vérifier si connecté
  const token = localStorage.getItem("authToken");
  if (token) {
    document.getElementById("admin-bar").classList.add("logged-in-flex");
    document.getElementById("modif").classList.add("logged-in-flex");
    document.getElementById("LogoutLink").classList.add("logged-in-flex");
    document.getElementById("LoginLink").classList.add("logged-in-none");
    document.querySelector("header").classList.add("margin-top");
    document.getElementById("filter").classList.add("logged-in-none");

    //
  }

  // Les adresses des APIs pour récupérer les données
  const worksURL = "http://localhost:5678/api/works";
  const categoriesURL = "http://localhost:5678/api/categories";

  // Récupérer les éléments HTML
  const gallery = document.getElementById("gallery");
  const filter = document.getElementById("filter");

  // Si la galerie n'existe pas, on arrête
  if (!gallery) {
    console.error("L'élément #gallery n'existe pas !");
    return;
  }

  // ========================================
  // ÉTAPE 2 : Charger toutes les données
  // ========================================
  loadAll();

  async function loadAll() {
    try {
      // Récupérer les projets
      const works = await fetchWorks();

      // Récupérer les catégories
      const categories = await fetchCategories();

      // Créer les boutons de filtre
      createFilterButtons(categories, works);

      // Afficher tous les projets au départ
      displayWorks(works);
    } catch (error) {
      console.error("Erreur:", error);
      gallery.textContent =
        "Erreur de chargement. Vérifie que l'API fonctionne.";
    }
  }

  // ========================================
  // FONCTION : Récupérer les projets
  // ========================================
  async function fetchWorks() {
    const response = await fetch(worksURL);

    if (!response.ok) {
      throw new Error("Impossible de récupérer les projets");
    }

    const works = await response.json();
    return works;
  }

  // ========================================
  // FONCTION : Récupérer les catégories
  // ========================================
  async function fetchCategories() {
    const response = await fetch(categoriesURL);

    if (!response.ok) {
      throw new Error("Impossible de récupérer les catégories");
    }

    const categories = await response.json();
    return categories;
  }

  // ========================================
  // FONCTION : Créer les boutons de filtre
  // ========================================
  const createFilterButtons = (categories, works) => {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "filters";

    // --- Bouton "Tous" ---
    const allButton = document.createElement("button");
    allButton.textContent = "Tous";
    allButton.className = "filter-btn active";

    allButton.addEventListener("click", () => {
      displayWorks(works);
      activateButton(allButton);
    });

    buttonContainer.appendChild(allButton);

    // --- Boutons par catégorie ---
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.textContent = category.name;
      button.className = "filter-btn";

      button.addEventListener("click", () => {
        // Filtrer les projets par catégorie
        const filteredWorks = works.filter(
          (work) => work.categoryId === category.id
        );

        displayWorks(filteredWorks);
        activateButton(button);
      });

      buttonContainer.appendChild(button);
    });

    filter.appendChild(buttonContainer);
  };

  // ========================================
  // FONCTION : Afficher les projets
  // ========================================
  const displayWorks = (works) => {
    // Vider la galerie
    gallery.innerHTML = "";

    // Créer une figure pour chaque projet
    works.forEach((work) => {
      const figure = createFigure(work);
      gallery.appendChild(figure);
    });
  };

  // ========================================
  // FONCTION : Créer une figure (image + titre)
  // ========================================
  const createFigure = (work) => {
    // Créer la balise <figure>
    const figure = document.createElement("figure");

    // Créer l'image
    const image = document.createElement("img");
    image.src = work.imageUrl;
    image.alt = work.title;

    // Créer le titre
    const caption = document.createElement("figcaption");
    caption.textContent = work.title;

    // Assembler le tout
    figure.appendChild(image);
    figure.appendChild(caption);

    return figure;
  };

  // ========================================
  // FONCTION : Activer un bouton
  // ========================================
  const activateButton = (clickedButton) => {
    // Désactiver tous les boutons
    const allButtons = document.querySelectorAll(".filter-btn");
    allButtons.forEach((button) => {
      button.classList.remove("active");
    });

    // Activer le bouton cliqué
    clickedButton.classList.add("active");
  };
});

// Fonction de déconnexion
function logout() {
  // 1. Supprimer le token du localStorage
  localStorage.removeItem("authToken");

  document.getElementById("admin-bar").classList.remove("logged-in-flex");
  document.getElementById("modif").classList.remove("logged-in-flex");
  document.getElementById("LoginLink").classList.remove("logged-in-none");
  document.getElementById("LogoutLink").classList.remove("logged-in-flex");
  document.querySelector("header").classList.remove("margin-top");
  document.getElementById("filter").classList.remove("logged-in-none");

  // Rechargement de la page
  window.location.reload();
}

// Attacher la fonction au bouton logout
document.getElementById("LogoutLink").addEventListener("click", logout);
