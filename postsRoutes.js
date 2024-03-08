const express = require("express");
const router = express.Router();

module.exports = function (pool) {
  async function executeQuery(query, params = []) {
    const [results] = await pool.execute(query, params);
    return results;
  }


router.post("/posts", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).send({ message: "Titre et contenu sont requis." });
  }

  try {
    const results = await executeQuery(
      "INSERT INTO posts (title, content, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
      [title, content]
    );
    res.send({ message: "Post créé avec succès", postId: results.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erreur lors de la création du post" });
  }
});

router.get("/posts", async (req, res) => {
  try {
    const posts = await executeQuery(
      "SELECT * FROM posts ORDER BY created_at DESC"
    );
    res.send(posts);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Erreur lors de la récupération des posts" });
  }
});

router.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await executeQuery("SELECT * FROM posts WHERE id = ?", [id]);
    if (post.length === 0) {
      return res.status(404).send({ message: "Post non trouvé" });
    }
    res.send(post[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erreur lors de la récupération du post" });
  }
});

router.put("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    await executeQuery(
      "UPDATE posts SET title = ?, content = ?, updated_at = NOW() WHERE id = ?",
      [title, content, id]
    );
    res.send({ message: "Post mis à jour avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erreur lors de la mise à jour du post" });
  }
});

router.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await executeQuery("DELETE FROM posts WHERE id = ?", [id]);
    res.send({ message: "Post supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erreur lors de la suppression du post" });
  }
});



  return router;
};
