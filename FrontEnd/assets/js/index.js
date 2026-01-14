// ========================================
// VARIABLES GLOBALES
// ========================================

// Tableaux qui stockent les données récupérées depuis l'API
var works = []; // Contiendra tous les projets (photos)
var categories = []; // Contiendra toutes les catégories (Objets, Appartements, etc.)

// URLs de l'API - ce sont les adresses où on va chercher les données
const worksURL = "http://localhost:5678/api/works"; // Pour récupérer/ajouter/supprimer les projets
const categoriesURL = "http://localhost:5678/api/categories"; // Pour récupérer les catégories

// Variable pour stocker l'élément galerie du DOM
let gallery = null;

// ========================================
// FONCTION : Créer une figure (image + titre)
// ========================================
// Crée un élément HTML <figure> pour UN projet
// Paramètre : work = objet avec id, title, imageUrl, categoryId
// Retourne : l'élément HTML <figure> créé

const createFigure = (work) => {
  // Créer la balise <figure>
  const figure = document.createElement("figure");
  // Ajouter data-id pour identifier ce projet (utile pour suppression)
  figure.setAttribute("data-id", work.id);

  // Créer l'image
  const image = document.createElement("img");
  image.src = work.imageUrl; // URL de l'image
  image.alt = work.title; // Texte alternatif (accessibilité)

  // Créer le titre
  const caption = document.createElement("figcaption");
  caption.textContent = work.title;

  // Assembler : image + titre dans la figure
  figure.appendChild(image);
  figure.appendChild(caption);

  return figure;
};

// ========================================
// FONCTION : Afficher les projets dans la galerie principale
// ========================================
// Paramètre : worksToDisplay = tableau de projets à afficher
// Cette fonction est utilisée pour afficher TOUS les projets ou les projets FILTRÉS

const displayWorks = (worksToDisplay) => {
  // Récupérer la galerie si pas encore fait
  if (!gallery) {
    gallery = document.getElementById("gallery");
  }

  // Vider la galerie avant d'afficher les nouveaux projets
  gallery.innerHTML = "";

  // Pour chaque projet, créer une figure et l'ajouter à la galerie
  worksToDisplay.forEach((work) => {
    const figure = createFigure(work);
    gallery.appendChild(figure);
  });
};

// ========================================
// FONCTION : Afficher les images dans la modale 1 (avec bouton suppression)
// ========================================
// Affiche les projets dans la modale avec un bouton poubelle sur chaque image

const displayWorksInModal = function () {
  // Récupérer la galerie de la modale
  const gallery1 = document.getElementById("gallery1");

  // Vider la galerie
  gallery1.innerHTML = "";

  // Pour chaque projet
  works.forEach((work) => {
    // Créer un conteneur pour l'image + bouton poubelle
    const imageWrapper = document.createElement("div");
    imageWrapper.style.position = "relative"; // Pour positionner le bouton poubelle en absolu
    imageWrapper.setAttribute("data-id", work.id);

    // Créer l'image
    const imageModal = document.createElement("img");
    imageModal.src = work.imageUrl;
    imageModal.alt = work.title;

    // Créer le bouton poubelle
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = `<i class="fa-solid fa-trash-can" style="pointer-events: none;"></i>`;
    deleteButton.className = "delete-btn";

    // ========== ÉVÉNEMENT : Suppression d'un projet ==========
    deleteButton.addEventListener("click", async function (e) {
      e.preventDefault(); // Empêche le comportement par défaut
      e.stopPropagation(); // Empêche la fermeture de la modale

      // Demander confirmation à l'utilisateur
      const confirmation = confirm("Supprimer cette image ?");
      if (!confirmation) return; // Si annulé, on arrête

      // Récupérer le token d'authentification
      const token = localStorage.getItem("authToken");

      try {
        // Envoyer requête DELETE à l'API
        const response = await fetch(
          `http://localhost:5678/api/works/${work.id}`, // URL avec l'ID du projet
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }, // Token pour prouver qu'on est connecté
          }
        );

        // Si suppression réussie
        if (response.ok) {
          // Retirer le projet du tableau works
          works = works.filter((w) => w.id !== work.id);
          // Rafraîchir les deux galeries
          displayWorks(works);
          displayWorksInModal();
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    });

    // Assembler : image + bouton dans le conteneur
    imageWrapper.appendChild(imageModal);
    imageWrapper.appendChild(deleteButton);
    // Ajouter le conteneur à la galerie de la modale
    gallery1.appendChild(imageWrapper);
  });
};

// ========================================
// DOMContentLoaded - Code exécuté quand la page est chargée
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  // ========== VÉRIFICATION CONNEXION ==========
  // Récupérer le token depuis le localStorage
  const token = localStorage.getItem("authToken");

  // Si le token existe = utilisateur connecté = mode admin
  if (token) {
    // Afficher les éléments admin
    document.getElementById("admin-bar").classList.add("logged-in-flex"); // Barre noire "Mode édition"
    document.getElementById("modif").classList.add("logged-in-flex"); // Icône modifier
    document.getElementById("LogoutLink").classList.add("logged-in-flex"); // Lien logout
    document.getElementById("LoginLink").classList.add("logged-in-none"); // Cacher lien login
    document.querySelector("header").classList.add("margin-top"); // Marge pour la barre admin
    document.getElementById("filter").classList.add("logged-in-none"); // Cacher les filtres
    document.querySelector(".btnBlack").classList.add("logged-in-flex"); // Bouton "Modifier"
  }

  // Attacher l'événement logout au lien
  document.getElementById("LogoutLink").addEventListener("click", logout);

  // Récupérer les éléments du DOM
  gallery = document.getElementById("gallery");
  const filter = document.getElementById("filter");

  // Vérifier que la galerie existe
  if (!gallery) {
    console.error("L'élément #gallery n'existe pas !");
    return;
  }

  // Charger toutes les données
  loadAll();

  // ========== FONCTION : Charger les données depuis l'API ==========
  async function loadAll() {
    try {
      // Récupérer les projets (GET)
      works = await fetchWorks();
      // Récupérer les catégories (GET)
      categories = await fetchCategories();
      // Créer les boutons de filtre
      createFilterButtons(categories, works);
      // Afficher tous les projets
      displayWorks(works);
    } catch (error) {
      console.error("Erreur:", error);
      gallery.textContent =
        "Erreur de chargement. Vérifie que l'API fonctionne.";
    }
  }

  // ========== FONCTION : Récupérer les projets (GET) ==========
  async function fetchWorks() {
    const response = await fetch(worksURL); // Requête GET par défaut
    if (!response.ok) {
      throw new Error("Impossible de récupérer les projets");
    }
    return await response.json(); // Convertir JSON en objet JavaScript
  }

  // ========== FONCTION : Récupérer les catégories (GET) ==========
  async function fetchCategories() {
    const response = await fetch(categoriesURL);
    if (!response.ok) {
      throw new Error("Impossible de récupérer les catégories");
    }
    return await response.json();
  }

  // ========== FONCTION : Créer les boutons de filtre ==========
  const createFilterButtons = (categories, worksData) => {
    // Créer le conteneur des boutons
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "filters";

    // ---------- Bouton "Tous" ----------
    const allButton = document.createElement("button");
    allButton.textContent = "Tous";
    allButton.className = "filter-btn active"; // Active par défaut

    // Quand on clique sur "Tous" = afficher tous les projets
    allButton.addEventListener("click", () => {
      displayWorks(works); // Afficher TOUS les projets
      activateButton(allButton); // Surligner ce bouton
    });

    buttonContainer.appendChild(allButton);

    // ---------- Boutons par catégorie ----------
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.textContent = category.name; // Nom de la catégorie
      button.className = "filter-btn";

      // Quand on clique = filtrer par catégorie
      button.addEventListener("click", () => {
        // Filtrer : garder seulement les projets de cette catégorie
        const filteredWorks = works.filter(
          (work) => work.categoryId === category.id
        );
        displayWorks(filteredWorks); // Afficher les projets filtrés
        activateButton(button); // Surligner ce bouton
      });

      buttonContainer.appendChild(button);
    });

    // Ajouter les boutons dans la page
    filter.appendChild(buttonContainer);
  };

  // ========== FONCTION : Activer (surligner) un bouton ==========
  const activateButton = (clickedButton) => {
    // Enlever "active" de tous les boutons
    const allButtons = document.querySelectorAll(".filter-btn");
    allButtons.forEach((button) => {
      button.classList.remove("active");
    });
    // Ajouter "active" au bouton cliqué
    clickedButton.classList.add("active");
  };
});

// ========================================
// FONCTION : Déconnexion
// ========================================
// Supprime le token et remet l'interface en mode "visiteur"

function logout() {
  // Supprimer le token du localStorage
  localStorage.removeItem("authToken");

  // Cacher les éléments admin
  document.getElementById("admin-bar").classList.remove("logged-in-flex");
  document.getElementById("modif").classList.remove("logged-in-flex");
  document.getElementById("LoginLink").classList.remove("logged-in-none");
  document.getElementById("LogoutLink").classList.remove("logged-in-flex");
  document.querySelector("header").classList.remove("margin-top");
  document.getElementById("filter").classList.remove("logged-in-none");
  document.querySelector(".btnBlack").classList.remove("logged-in-flex");
}

// ========================================
// MODAL 1 - Gestion de la modale galerie
// ========================================

let modal = null; // Modale actuellement ouverte
const focusableSelector = "button, a, input, textarea"; // Éléments focusables (accessibilité)
let focusables = []; // Liste des éléments focusables
let previouslyFocusedElement = null; // Élément qui avait le focus avant

// ========== FONCTION : Ouvrir la modale ==========
const openModal = function (e) {
  e.preventDefault(); // Empêche la navigation du lien

  // Récupérer la modale à ouvrir (via l'attribut href du lien)
  modal = document.querySelector(e.target.getAttribute("href"));

  // Récupérer les éléments focusables (accessibilité)
  focusables = Array.from(modal.querySelectorAll(focusableSelector));
  previouslyFocusedElement = document.querySelector(":focus");

  // Donner le focus au premier élément
  if (focusables.length > 0) {
    focusables[0].focus();
  }

  // Afficher la modale
  modal.style.display = "flex";
  modal.removeAttribute("aria-hidden"); // Accessibilité : visible
  modal.setAttribute("aria-modal", "true"); // Accessibilité : c'est une modale

  // Ajouter les événements pour fermer
  modal.addEventListener("click", closeModal); // Clic sur fond noir
  modal.querySelector(".modal-close").addEventListener("click", closeModal); // Clic sur X
  modal
    .querySelector(".js-modal-stop")
    .addEventListener("click", stopPropagation); // Empêche fermeture si clic à l'intérieur

  // Afficher les images dans la modale
  displayWorksInModal();
};

// ========== FONCTION : Fermer la modale ==========
const closeModal = function (e) {
  if (modal === null) return; // Si pas de modale ouverte, on arrête
  if (previouslyFocusedElement !== null) previouslyFocusedElement.focus(); // Rendre le focus
  e.preventDefault();

  // Accessibilité : modale cachée
  modal.setAttribute("aria-hidden", "true");
  modal.removeAttribute("aria-modal");

  // Retirer les événements
  modal.removeEventListener("click", closeModal);
  modal.querySelector(".modal-close").removeEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-stop")
    .removeEventListener("click", stopPropagation);

  // Cacher la modale après 500ms (pour l'animation)
  window.setTimeout(function () {
    modal.style.display = "none";
    modal = null;
  }, 500);
};

// ========== FONCTION : Empêcher la propagation du clic ==========
// Empêche la modale de se fermer quand on clique à l'intérieur
const stopPropagation = function (e) {
  e.stopPropagation();
};

// ========== FONCTION : Navigation clavier dans la modale (accessibilité) ==========
const focusInModal = function (e) {
  e.preventDefault();
  let index = focusables.findIndex((f) => f === modal.querySelector(":focus"));

  // Shift+Tab = reculer, Tab = avancer
  if (e.shiftKey === true) {
    index--;
  } else {
    index++;
  }

  // Boucler au début/fin de la liste
  if (index >= focusables.length) index = 0;
  if (index < 0) index = focusables.length - 1;

  focusables[index].focus();
};

// Attacher l'événement d'ouverture à tous les liens avec classe .js-modal
document.querySelectorAll(".js-modal").forEach((a) => {
  a.addEventListener("click", openModal);
});

// Événements clavier : Escape pour fermer, Tab pour naviguer
window.addEventListener("keydown", function (e) {
  if (e.key === "Escape" || e.key === "Esc") {
    closeModal(e);
  }
  if (e.key === "Tab" && modal !== null) {
    focusInModal(e);
  }
});

// ========================================
// MODAL 2 - Formulaire d'ajout de photo
// ========================================

const modal2 = document.getElementById("modal2"); // Modale 2
const btnAddPhoto = document.getElementById("btn-add-photo"); // Bouton "Ajouter une photo"
const modalBack = document.getElementById("modal-back"); // Flèche retour

// ========== Ouvrir Modal 2 (depuis Modal 1) ==========
btnAddPhoto.addEventListener("click", function () {
  // Cacher Modal 1
  modal.style.display = "none";

  // Afficher Modal 2
  modal2.style.display = "flex";
  modal2.removeAttribute("aria-hidden");
  modal2.setAttribute("aria-modal", "true");

  // Remplir le select des catégories dynamiquement
  const categorySelect = document.getElementById("photo-category");
  categorySelect.innerHTML = '<option value=""></option>'; // Option vide par défaut

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
});

// ========== Retour à Modal 1 (flèche) ==========
modalBack.addEventListener("click", function (e) {
  e.preventDefault();
  modal2.style.display = "none";
  modal2.setAttribute("aria-hidden", "true");
  modal2.removeAttribute("aria-modal");
  resetForm(); // Vider le formulaire
  modal.style.display = "flex"; // Réafficher Modal 1
});

// ========== Fermer Modal 2 avec X ==========
modal2.querySelector(".modal-close").addEventListener("click", function (e) {
  e.preventDefault();
  modal2.style.display = "none";
  modal2.setAttribute("aria-hidden", "true");
  modal2.removeAttribute("aria-modal");
  resetForm();
});

// ========== Fermer Modal 2 en cliquant en dehors ==========
modal2.addEventListener("click", function (e) {
  if (e.target === modal2) {
    // Si clic sur le fond noir (pas le contenu)
    modal2.style.display = "none";
    modal2.setAttribute("aria-hidden", "true");
    modal2.removeAttribute("aria-modal");
    resetForm();
  }
});

// ========================================
// FORMULAIRE AJOUT PHOTO
// ========================================

// Récupérer les éléments du formulaire
const photoInput = document.getElementById("photo-input"); // Input fichier
const previewImage = document.getElementById("preview-image"); // Image de prévisualisation
const uploadZone = document.getElementById("upload-zone"); // Zone d'upload
const photoTitle = document.getElementById("photo-title"); // Champ titre
const photoCategory = document.getElementById("photo-category"); // Select catégorie
const btnValidate = document.getElementById("btn-validate"); // Bouton Valider
const addPhotoForm = document.getElementById("add-photo-form"); // Le formulaire

// ========== FONCTION : Vérifier si le formulaire est complet ==========
// Si les 3 champs sont remplis → bouton VERT, sinon → bouton GRIS
function checkForm() {
  if (photoInput.files[0] && photoTitle.value && photoCategory.value) {
    btnValidate.classList.add("active"); // Bouton vert
  } else {
    btnValidate.classList.remove("active"); // Bouton gris
  }
}

// ========== FONCTION : Réinitialiser le formulaire ==========
function resetForm() {
  addPhotoForm.reset(); // Vider tous les champs
  previewImage.style.display = "none"; // Cacher prévisualisation
  previewImage.src = ""; // Vider la source
  uploadZone.querySelector(".upload-icon").style.display = "block"; // Réafficher icône
  uploadZone.querySelector(".upload-btn").style.display = "block"; // Réafficher bouton
  uploadZone.querySelector(".upload-info").style.display = "block"; // Réafficher texte info
  btnValidate.classList.remove("active"); // Bouton gris
}

// ========== ÉVÉNEMENT : Prévisualisation de l'image ==========
photoInput.addEventListener("change", function () {
  const file = photoInput.files[0]; // Récupérer le fichier sélectionné

  if (file) {
    // Utiliser FileReader pour lire le fichier et l'afficher
    const reader = new FileReader();

    // Quand le fichier est lu → afficher l'image
    reader.onload = function (e) {
      previewImage.src = e.target.result; // e.target.result = image en data URL
    };

    reader.readAsDataURL(file); // Lancer la lecture du fichier

    // Afficher l'image de prévisualisation
    previewImage.style.display = "block";

    // Cacher l'icône, le bouton et le texte
    uploadZone.querySelector(".upload-icon").style.display = "none";
    uploadZone.querySelector(".upload-btn").style.display = "none";
    uploadZone.querySelector(".upload-info").style.display = "none";

    // Vérifier si le formulaire est complet
    checkForm();
  }
});

// Vérifier le formulaire quand on tape le titre
photoTitle.addEventListener("input", checkForm);

// Vérifier le formulaire quand on choisit une catégorie
photoCategory.addEventListener("change", checkForm);

// ========================================
// SOUMISSION DU FORMULAIRE À L'API (POST)
// ========================================

addPhotoForm.addEventListener("submit", async function (e) {
  e.preventDefault(); // Empêche le rechargement de la page

  // Créer un objet FormData pour envoyer les fichiers
  const formData = new FormData();
  formData.append("image", photoInput.files[0]); // Le fichier image
  formData.append("title", photoTitle.value); // Le titre
  formData.append("category", photoCategory.value); // La catégorie

  // Récupérer le token d'authentification
  const token = localStorage.getItem("authToken");

  try {
    // Envoyer requête POST à l'API
    const response = await fetch("http://localhost:5678/api/works", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // Token pour prouver qu'on est connecté
      body: formData, // Les données du formulaire
    });

    // Si l'ajout a réussi
    if (response.ok) {
      // Récupérer le nouveau projet créé par l'API
      const newWork = await response.json();

      // Convertir categoryId de string en number (pour les filtres)
      newWork.categoryId = parseInt(newWork.categoryId);

      // Ajouter le nouveau projet au tableau works
      works.push(newWork);

      // Rafraîchir les galeries
      displayWorks(works);
      displayWorksInModal();

      // Vider le formulaire
      resetForm();
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
});
