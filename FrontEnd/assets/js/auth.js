function ajoutListenerLogin(){
    document.querySelector("form").addEventListener("submit", async function (event) {
        event.preventDefault(); // empêche le rechargement

        // Récupère les valeurs
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:5678/api/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.token); // sauvegarde le token
                window.location.href = "index.html"; // va à index.html
            } else {
                alert("Email ou mot de passe incorrect");
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Problème de connexion");
        }
    });
}

document.addEventListener("DOMContentLoaded", ajoutListenerLogin);
