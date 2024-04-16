require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const app = express();
const port = 3000;

// Configuration de la base de données en utilisant DATABASE_URL
const pool = mysql.createPool(process.env.DATABASE_URL);
// Ici, importez postsRoutes après avoir défini pool
const postsRoutes = require("./postsRoutes")(pool); // Assurez-vous que le chemin vers postsRoutes est correct

app.use(
  cors({
    origin: [
      "http://localhost:3001", // For local development
      "http://localhost:3000", // For local development
      "https://kaminuxt.netlify.app", // Netlify frontend
      "https://apiusers-dbia.onrender.com", // backend
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Middleware
app.use(bodyParser.json());
app.use("/api", postsRoutes);

// Fonction pour exécuter les requêtes SQL
async function executeQuery(query, params = []) {
  const [results] = await pool.execute(query, params);
  return results;
}

// Routes

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Vérifier si username et password sont fournis
  if (!username || !password) {
    return res
      .status(400)
      .send({ message: "Les champs username et password sont requis." });
  }

  try {
    // Vérifier si l'utilisateur existe
    const [user] = await executeQuery(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (!user) {
      return res
        .status(401)
        .send({ message: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    // Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .send({ message: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    res.send({ message: "Connexion réussie", userId: user.id });
    // Implémentez ici la logique de session ou de token selon votre approche d'authentification
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Erreur lors de la tentative de connexion" });
  }
});
app.post("/users", async (req, res) => {
  const { username, email, password } = req.body; // Assurez-vous d'inclure 'password' dans le corps de la requête

  // Vérifier si username, email et password sont fournis
  if (!username || !email || !password) {
    return res
      .status(400)
      .send({ message: "Les champs username, email et password sont requis." });
  }

  try {
    // Hacher le mot de passe avant de l'insérer dans la base de données
    const hashedPassword = await bcrypt.hash(password, 10); // 10 est le nombre de tours de salage

    // Insérer l'utilisateur avec le mot de passe haché
    await executeQuery(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [
        username,
        email,
        hashedPassword, // Utiliser le mot de passe haché ici
      ]
    );

    res.send({ message: "Utilisateur créé avec succès" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Erreur lors de la création de l'utilisateur" });
  }
});

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await executeQuery("DELETE FROM users WHERE id = ?", [id]);
    res.send({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Erreur lors de la suppression de l'utilisateur" });
  }
});

app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, picture, description, firstname, surname } =
    req.body; // Updated to include new fields

  try {
    // Update query to include the new fields
    await executeQuery(
      "UPDATE users SET username = ?, email = ?, picture = ?, description = ?, firstname = ?, surname = ? WHERE id = ?",
      [username, email, picture, description, firstname, surname, id]
    );
    res.send({ message: "Utilisateur mis à jour avec succès" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Erreur lors de la mise à jour de l'utilisateur" });
  }
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await executeQuery("SELECT * FROM users WHERE id = ?", [id]);
    res.send(user[0] || {});
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Erreur lors de la récupération de l'utilisateur" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await executeQuery("SELECT * FROM users");
    res.send(users);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Erreur lors de la récupération des utilisateurs" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.error(err);
    }
    res.send({ message: "Déconnexion réussie" });
  });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`L'application écoute sur le port ${port}`);
});
