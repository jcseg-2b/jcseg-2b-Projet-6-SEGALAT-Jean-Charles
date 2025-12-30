// Déclaration de deux tableaux vides qui vont stocker nos données
var works = []; // Contiendra tous les projets (works)
var categories = []; // Contiendra toutes les catégories

// Les adresses des APIs pour récupérer les données
const worksURL = "http://localhost:5678/api/works";
const categoriesURL = "http://localhost:5678/api/categories";

// Variable pour la galerie (accessible globalement)
let gallery = null;

// ========================================
// FONCTION : Créer une figure (image + titre)
// ========================================
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

// ========================================
// FONCTION : Afficher les projets (GLOBALE)
// ========================================
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

// ========================================
// FONCTION : Afficher les images dans la modal (GLOBALE)
// ========================================
const displayWorksInModal = function () {
  const gallery1 = document.getElementById("gallery1");
  gallery1.innerHTML = "";

  works.forEach((work) => {
    const imageWrapper = document.createElement("div");
    imageWrapper.style.position = "relative";
    imageWrapper.setAttribute("data-id", work.id);

    const imageModal = document.createElement("img");
    imageModal.src = work.imageUrl;
    imageModal.alt = work.title;

    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = `<i class="fa-solid fa-trash-can" style="pointer-events: none;"></i>`;
    deleteButton.className = "delete-btn";

    // Événement de suppression
    deleteButton.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();

      console.log("=== CLIC POUBELLE ===");
      console.log("work.id:", work.id);

      const confirmation = confirm("Supprimer cette image ?");
      console.log("Confirmation:", confirmation);

      if (!confirmation) {
        console.log("Annulé");
        return;
      }

      const token = localStorage.getItem("authToken");
      console.log("Token:", token);

      try {
        const response = await fetch(
          `http://localhost:5678/api/works/${work.id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Response status:", response.status);

        if (response.ok) {
          console.log("Suppression réussie !");
          // Supprimer du tableau works
          works = works.filter((w) => w.id !== work.id);
          // Rafraîchir les deux galeries
          displayWorks(works);
          displayWorksInModal();
        } else {
          console.log("Erreur API:", response.status);
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    });

    imageWrapper.appendChild(imageModal);
    imageWrapper.appendChild(deleteButton);
    gallery1.appendChild(imageWrapper);
  });
};

// =======================================
// DOMContentLoaded
// ========================================
document.addEventListener("DOMContentLoaded", () => {
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

  gallery = document.getElementById("gallery");
  const filter = document.getElementById("filter");

  if (!gallery) {
    console.error("L'élément #gallery n'existe pas !");
    return;
  }

  loadAll();

  async function loadAll() {
    try {
      works = await fetchWorks();
      categories = await fetchCategories();
      createFilterButtons(categories, works);
      displayWorks(works);
    } catch (error) {
      console.error("Erreur:", error);
      gallery.textContent =
        "Erreur de chargement. Vérifie que l'API fonctionne.";
    }
  }

  async function fetchWorks() {
    const response = await fetch(worksURL);
    if (!response.ok) {
      throw new Error("Impossible de récupérer les projets");
    }
    return await response.json();
  }

  async function fetchCategories() {
    const response = await fetch(categoriesURL);
    if (!response.ok) {
      throw new Error("Impossible de récupérer les catégories");
    }
    return await response.json();
  }

  const createFilterButtons = (categories, worksData) => {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "filters";

    const allButton = document.createElement("button");
    allButton.textContent = "Tous";
    allButton.className = "filter-btn active";

    allButton.addEventListener("click", () => {
      displayWorks(works);
      activateButton(allButton);
    });

    buttonContainer.appendChild(allButton);

    categories.forEach((category) => {
      const button = document.createElement("button");
      button.textContent = category.name;
      button.className = "filter-btn";

      button.addEventListener("click", () => {
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

  const activateButton = (clickedButton) => {
    const allButtons = document.querySelectorAll(".filter-btn");
    allButtons.forEach((button) => {
      button.classList.remove("active");
    });
    clickedButton.classList.add("active");
  };
});

// Fonction de déconnexion
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

// ========================================
// MODAL - Gestion de la modale
// ========================================
let modal = null;
const focusableSelector = "button, a, input, textarea";
let focusables = [];
let previouslyFocusedElement = null;
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

const stopPropagation = function (e) {
  e.stopPropagation();
};

const focusInModal = function (e) {
  e.preventDefault();
  let index = focusables.findIndex((f) => f === modal.querySelector(":focus"));

  if (e.shiftKey === true) {
    index--;
  } else {
    index++;
  }

  if (index >= focusables.length) {
    index = 0;
  }

  if (index < 0) {
    index = focusables.length - 1;
  }

  focusables[index].focus();
};

document.querySelectorAll(".js-modal").forEach((a) => {
  a.addEventListener("click", openModal);
});

window.addEventListener("keydown", function (e) {
  if (e.key === "Escape" || e.key === "Esc") {
    closeModal(e);
  }
  if (e.key === "Tab" && modal !== null) {
    focusInModal(e);
  }
});

// ========================================
// MODAL 2 - Ajout de photo
// ========================================

const modal2 = document.getElementById("modal2");
const btnAddPhoto = document.getElementById("btn-add-photo");
const modalBack = document.getElementById("modal-back");

// Ouvrir Modal 2 quand on clique sur "Ajouter une photo"
btnAddPhoto.addEventListener("click", function () {
  // Cacher Modal 1
  modal.style.display = "none";
  // Afficher Modal 2
  modal2.style.display = "flex";
  modal2.removeAttribute("aria-hidden");
  modal2.setAttribute("aria-modal", "true");
});

// Retour à Modal 1 quand on clique sur la flèche
modalBack.addEventListener("click", function (e) {
  e.preventDefault();
  // Cacher Modal 2
  modal2.style.display = "none";
  modal2.setAttribute("aria-hidden", "true");
  modal2.removeAttribute("aria-modal");
  // Afficher Modal 1
  modal.style.display = "flex";
});

// Fermer Modal 2 avec le bouton X
modal2.querySelector(".modal-close").addEventListener("click", function (e) {
  e.preventDefault();
  modal2.style.display = "none";
  modal2.setAttribute("aria-hidden", "true");
  modal2.removeAttribute("aria-modal");
});

// Fermer Modal 2 en cliquant en dehors
modal2.addEventListener("click", function (e) {
  if (e.target === modal2) {
    modal2.style.display = "none";
    modal2.setAttribute("aria-hidden", "true");
    modal2.removeAttribute("aria-modal");
  }
});
