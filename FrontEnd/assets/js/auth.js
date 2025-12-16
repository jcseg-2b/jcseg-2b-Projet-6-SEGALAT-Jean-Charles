// Fonction principale qui gère la connexion utilisateur
function ajoutListenerLogin() {
    
    // Sélectionne le premier formulaire de la page
    const form = document.querySelector("form");
    
    // Ajoute un écouteur d'événement sur la soumission du formulaire
    // "async" permet d'utiliser "await" pour les opérations asynchrones
    form.addEventListener("submit", async (event) => {
        
        // Empêche le rechargement de la page (comportement par défaut d'un formulaire)
        event.preventDefault();
        
        // Récupère la valeur du champ email et enlève les espaces inutiles
        const email = document.getElementById("email").value.trim();
        
        // Récupère la valeur du champ mot de passe
        const password = document.getElementById("password").value;
        
        // Vérifie que les champs ne sont pas vides
        if (!email || !password) {
            alert("Veuillez remplir tous les champs"); // Message d'erreur
            return; // Arrête l'exécution de la fonction
        }
        
        // Bloc try : pour gérer les erreurs potentielles
        try {
            // Envoie une requête HTTP POST vers l'API de connexion
            // "await" attend la réponse avant de continuer
            const response = await fetch("http://localhost:5678/api/users/login", {
                method: "POST", // Type de requête : POST (pour envoyer des données)
                headers: { 
                    "Content-Type": "application/json" // Indique qu'on envoie du JSON
                },
                body: JSON.stringify({ email, password }) // Convertit les données en JSON
            });
            
            // Vérifie si la réponse est réussie (code 200-299)
            if (response.ok) {
                
                // Convertit la réponse JSON en objet JavaScript
                // Destructuration : on extrait directement la propriété "token"
                const { token } = await response.json();
                
                // Sauvegarde le token dans le stockage local du navigateur
                // Permet de rester connecté et d'authentifier les futures requêtes
                localStorage.setItem("token", token);
                
                // Redirige l'utilisateur vers la page d'accueil
                window.location.href = "index.html";
                
            } else {
                // Si la connexion échoue (mauvais identifiants)
                alert("Email ou mot de passe incorrect");
            }
            
        } catch (error) {
            // Capture toute erreur (problème réseau, serveur inaccessible, etc.)
            console.error("Erreur:", error); // Affiche l'erreur dans la console
            alert("Problème de connexion au serveur"); // Message utilisateur
        }
    });
}

// Attend que tout le HTML soit chargé avant d'exécuter la fonction
// Garantit que le formulaire existe dans le DOM
document.addEventListener("DOMContentLoaded", ajoutListenerLogin);
