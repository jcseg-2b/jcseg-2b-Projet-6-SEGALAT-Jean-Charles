// ============================================================================
// 1. VARIABLES GLOBALES
// ============================================================================

var works = []; // Tableau des projets (photos)
var categories = []; // Tableau des catégories

const worksURL = "http://localhost:5678/api/works"; // URL API projets
const categoriesURL = "http://localhost:5678/api/categories"; // URL API catégories

let gallery = null; // Élément galerie du DOM

// ============================================================================
// 2. FONCTIONS D'AFFICHAGE - GALERIE PRINCIPALE
// ============================================================================

// Crée un élément <figure> pour un projet
const createFigure = (work) => {
  const figure = document.createElement("figure");
  figure.setAttribute("data-id", work.id);

  const image = document.createElement("img");
  image.src = work.imageUrl;
  image.alt = work.title;

  const caption = document.createElement("figcaption");
  caption.textContent = work.title;

  figure.appendChild(image);
  figure.appendChild(caption);

  return figure;
};

// Affiche les projets dans la galerie principale
const displayWorks = (worksToDisplay) => {
  if (!gallery) {
    gallery = document.getElementById("gallery");
  }
  gallery.innerHTML = "";

  worksToDisplay.forEach((work) => {
    const figure = createFigure(work);
    gallery.appendChild(figure);
  });
};

// ============================================================================
// 3. FONCTIONS D'AFFICHAGE - GALERIE MODALE (avec suppression)
// ============================================================================

// Affiche les projets dans la modale avec bouton poubelle
const displayWorksInModal = function () {
  const gallery1 = document.getElementById("gallery1");
  gallery1.innerHTML = "";

  works.forEach((work) => {
    // Conteneur image + bouton poubelle
    const imageWrapper = document.createElement("div");
    imageWrapper.style.position = "relative";
    imageWrapper.setAttribute("data-id", work.id);

    // Image
    const imageModal = document.createElement("img");
    imageModal.src = work.imageUrl;
    imageModal.alt = work.title;

    // Bouton poubelle
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = `<i class="fa-solid fa-trash-can" style="pointer-events: none;"></i>`;
    deleteButton.className = "delete-btn";

    // Événement suppression
    deleteButton.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();

      const confirmation = confirm("Supprimer cette image ?");
      if (!confirmation) return;

      const token = localStorage.getItem("authToken");

      try {
        const response = await fetch(
          `http://localhost:5678/api/works/${work.id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          works = works.filter((w) => w.id !== work.id);
          displayWorks(works);
          displayWorksInModal();
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    });

    // Assembler
    imageWrapper.appendChild(imageModal);
    imageWrapper.appendChild(deleteButton);
    gallery1.appendChild(imageWrapper);
  });
};

// ============================================================================
// 4. AUTHENTIFICATION - Déconnexion
// ============================================================================

// Déconnecte l'utilisateur
function logout() {
  localStorage.removeItem("authToken");

  document.getElementById("admin-bar").classList.remove("logged-in-flex");
  document.getElementById("modif").classList.remove("logged-in-flex");
  document.getElementById("LoginLink").classList.remove("logged-in-none");
  document.getElementById("LogoutLink").classList.remove("logged-in-flex");
  document.querySelector("header").classList.remove("margin-top");
  document.getElementById("filter").classList.remove("logged-in-none");
  document.querySelector(".btnBlack").classList.remove("logged-in-flex");
}

// ============================================================================
// 5. INITIALISATION - Au chargement de la page (DOMContentLoaded)
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ----- Vérifier si connecté -----
  const token = localStorage.getItem("authToken");

  if (token) {
    document.getElementById("admin-bar").classList.add("logged-in-flex");
    document.getElementById("modif").classList.add("logged-in-flex");
    document.getElementById("LogoutLink").classList.add("logged-in-flex");
    document.getElementById("LoginLink").classList.add("logged-in-none");
    document.querySelector("header").classList.add("margin-top");
    document.getElementById("filter").classList.add("logged-in-none");
    document.querySelector(".btnBlack").classList.add("logged-in-flex");
  }

  document.getElementById("LogoutLink").addEventListener("click", logout);

  // ----- Récupérer les éléments du DOM -----
  gallery = document.getElementById("gallery");
  const filter = document.getElementById("filter");

  if (!gallery) {
    console.error("L'élément #gallery n'existe pas !");
    return;
  }

  // ----- Charger les données -----
  loadAll();

  // Charge les projets et catégories depuis l'API
  async function loadAll() {
    try {
      works = await fetchWorks();
      categories = await fetchCategories();
      createFilterButtons(categories);
      displayWorks(works);
    } catch (error) {
      console.error("Erreur:", error);
      gallery.textContent =
        "Erreur de chargement. Vérifie que l'API fonctionne.";
    }
  }

  // Récupère les projets (GET)
  async function fetchWorks() {
    const response = await fetch(worksURL);
    if (!response.ok) {
      throw new Error("Impossible de récupérer les projets");
    }
    return await response.json();
  }

  // Récupère les catégories (GET)
  async function fetchCategories() {
    const response = await fetch(categoriesURL);
    if (!response.ok) {
      throw new Error("Impossible de récupérer les catégories");
    }
    return await response.json();
  }

  // ----- Créer les boutons de filtre -----
  const createFilterButtons = (categories) => {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "filters";

    // Bouton "Tous"
    const allButton = document.createElement("button");
    allButton.textContent = "Tous";
    allButton.className = "filter-btn active";

    allButton.addEventListener("click", () => {
      displayWorks(works);
      activateButton(allButton);
    });

    buttonContainer.appendChild(allButton);

    // Boutons par catégorie
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.textContent = category.name;
      button.className = "filter-btn";

      button.addEventListener("click", () => {
        const filteredWorks = works.filter(
          (work) => work.categoryId === category.id,
        );
        displayWorks(filteredWorks);
        activateButton(button);
      });

      buttonContainer.appendChild(button);
    });

    filter.appendChild(buttonContainer);
  };

  // Active (surligne) le bouton cliqué
  const activateButton = (clickedButton) => {
    const allButtons = document.querySelectorAll(".filter-btn");
    allButtons.forEach((button) => {
      button.classList.remove("active");
    });
    clickedButton.classList.add("active");
  };
});

// ============================================================================
// 6. MODALE 1 - Galerie photo
// ============================================================================

let modal = null;
const focusableSelector = "button, a, input, textarea, select";
let focusables = [];
let previouslyFocusedElement = null;

// Ouvre la modale
const openModal = function (e) {
  e.preventDefault();
  modal = document.querySelector(e.target.getAttribute("href"));
  focusables = Array.from(modal.querySelectorAll(focusableSelector));
  previouslyFocusedElement = document.querySelector(":focus");

  if (focusables.length > 0) {
    focusables[0].focus();
  }

  modal.style.display = "flex";
  modal.removeAttribute("aria-hidden");
  modal.setAttribute("aria-modal", "true");

  modal.addEventListener("click", closeModal);
  modal.querySelector(".modal-close").addEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-stop")
    .addEventListener("click", stopPropagation);

  displayWorksInModal();
};

// Ferme la modale
const closeModal = function (e) {
  if (modal === null) return;
  if (previouslyFocusedElement !== null) previouslyFocusedElement.focus();
  e.preventDefault();

  modal.setAttribute("aria-hidden", "true");
  modal.removeAttribute("aria-modal");

  modal.removeEventListener("click", closeModal);
  modal.querySelector(".modal-close").removeEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-stop")
    .removeEventListener("click", stopPropagation);

  window.setTimeout(function () {
    modal.style.display = "none";
    modal = null;
  }, 500);
};

// Empêche la fermeture quand on clique à l'intérieur
const stopPropagation = function (e) {
  e.stopPropagation();
};

// Navigation clavier dans la modale 1 (accessibilité)
const focusInModal = function (e) {
  e.preventDefault();
  let index = focusables.findIndex((f) => f === modal.querySelector(":focus"));

  if (e.shiftKey === true) {
    index--;
  } else {
    index++;
  }

  if (index >= focusables.length) index = 0;
  if (index < 0) index = focusables.length - 1;

  focusables[index].focus();
};

// Attacher l'événement d'ouverture aux liens .js-modal
document.querySelectorAll(".js-modal").forEach((a) => {
  a.addEventListener("click", openModal);
});

// ============================================================================
// 7. MODALE 2 - Formulaire d'ajout de photo
// ============================================================================

const modal2 = document.getElementById("modal2");
let focusables2 = [];
let previouslyFocusedElement2 = null;

const btnAddPhoto = document.getElementById("btn-add-photo");
const modalBack = document.getElementById("modal-back");

// Ouvre Modal 2 depuis Modal 1
btnAddPhoto.addEventListener("click", function () {
  modal.style.display = "none";

  modal2.style.display = "flex";
  modal2.removeAttribute("aria-hidden");
  modal2.setAttribute("aria-modal", "true");

  // Accessibilité : récupérer les éléments focusables
  focusables2 = Array.from(modal2.querySelectorAll(focusableSelector));
  previouslyFocusedElement2 = document.querySelector(":focus");
  if (focusables2.length > 0) {
    focusables2[0].focus();
  }

  // Remplir le select des catégories
  const categorySelect = document.getElementById("photo-category");
  categorySelect.innerHTML = '<option value=""></option>';

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
});

// Retour à Modal 1 (flèche)
modalBack.addEventListener("click", function (e) {
  e.preventDefault();
  modal2.style.display = "none";
  modal2.setAttribute("aria-hidden", "true");
  modal2.removeAttribute("aria-modal");
  resetForm();
  if (previouslyFocusedElement2 !== null) previouslyFocusedElement2.focus();
  modal.style.display = "flex";
});

// Fermer Modal 2 avec X
modal2.querySelector(".modal-close").addEventListener("click", function (e) {
  e.preventDefault();
  modal2.style.display = "none";
  modal2.setAttribute("aria-hidden", "true");
  modal2.removeAttribute("aria-modal");
  resetForm();
  if (previouslyFocusedElement2 !== null) previouslyFocusedElement2.focus();
});

// Fermer Modal 2 en cliquant en dehors
modal2.addEventListener("click", function (e) {
  if (e.target === modal2) {
    modal2.style.display = "none";
    modal2.setAttribute("aria-hidden", "true");
    modal2.removeAttribute("aria-modal");
    resetForm();
    if (previouslyFocusedElement2 !== null) previouslyFocusedElement2.focus();
  }
});

// ============================================================================
// 8. FORMULAIRE - Ajout de photo
// ============================================================================

const photoInput = document.getElementById("photo-input");
const previewImage = document.getElementById("preview-image");
const uploadZone = document.getElementById("upload-zone");
const photoTitle = document.getElementById("photo-title");
const photoCategory = document.getElementById("photo-category");
const btnValidate = document.getElementById("btn-validate");
const addPhotoForm = document.getElementById("add-photo-form");

// Vérifie si le formulaire est complet (bouton vert/gris)
function checkForm() {
  if (photoInput.files[0] && photoTitle.value && photoCategory.value) {
    btnValidate.classList.add("active");
  } else {
    btnValidate.classList.remove("active");
  }
}

// Réinitialise le formulaire
function resetForm() {
  addPhotoForm.reset();
  previewImage.style.display = "none";
  previewImage.src = "";
  uploadZone.querySelector(".upload-icon").style.display = "block";
  uploadZone.querySelector(".upload-btn").style.display = "block";
  uploadZone.querySelector(".upload-info").style.display = "block";
  btnValidate.classList.remove("active");
}

// Prévisualisation de l'image
photoInput.addEventListener("change", function () {
  const file = photoInput.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      previewImage.src = e.target.result;
    };

    reader.readAsDataURL(file);

    previewImage.style.display = "block";
    uploadZone.querySelector(".upload-icon").style.display = "none";
    uploadZone.querySelector(".upload-btn").style.display = "none";
    uploadZone.querySelector(".upload-info").style.display = "none";

    checkForm();
  }
});

// Vérifier le formulaire quand on tape le titre
photoTitle.addEventListener("input", checkForm);

// Vérifier le formulaire quand on choisit une catégorie
photoCategory.addEventListener("change", checkForm);

// ============================================================================
// 9. ENVOI DU FORMULAIRE À L'API (POST)
// ============================================================================

addPhotoForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("image", photoInput.files[0]);
  formData.append("title", photoTitle.value);
  formData.append("category", photoCategory.value);

  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch("http://localhost:5678/api/works", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (response.ok) {
      const newWork = await response.json();
      newWork.categoryId = parseInt(newWork.categoryId);
      works.push(newWork);
      displayWorks(works);
      displayWorksInModal();
      resetForm();
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
});

// ============================================================================
// 10. ÉVÉNEMENTS CLAVIER - Escape et Tab (Accessibilité)
// ============================================================================

document.addEventListener("keydown", function (e) {
  const modal2Ouverte = modal2 && modal2.style.display === "flex";
  const modal1Ouverte = modal !== null && modal.style.display === "flex";

  // ----- Fermer avec Escape -----
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();

    if (modal2Ouverte) {
      modal2.style.display = "none";
      modal2.setAttribute("aria-hidden", "true");
      modal2.removeAttribute("aria-modal");
      resetForm();
      modal.style.display = "flex";
      return;
    }

    if (modal1Ouverte) {
      closeModal(e);
      return;
    }
  }

  // ----- Navigation Tab -----
  if (e.key === "Tab") {
    // Tab dans Modal 2
    if (modal2Ouverte) {
      e.preventDefault();

      const elements = modal2.querySelectorAll(
        "button:not([hidden]), input:not([hidden]), select:not([hidden]), textarea:not([hidden]), a:not([hidden])",
      );
      const visibles = Array.from(elements).filter((el) => {
        return el.offsetWidth > 0 && el.offsetHeight > 0;
      });

      if (visibles.length === 0) return;

      const currentIndex = visibles.indexOf(document.activeElement);
      let nextIndex;

      if (e.shiftKey) {
        nextIndex = currentIndex <= 0 ? visibles.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex >= visibles.length - 1 ? 0 : currentIndex + 1;
      }

      visibles[nextIndex].focus();
      return;
    }

    // Tab dans Modal 1
    if (modal1Ouverte && !modal2Ouverte) {
      focusInModal(e);
    }
  }
});
