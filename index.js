const express = require("express");
const QRcode = require ("qrcode");
const app = express();
const cassandra = require('cassandra-driver')
const client = new cassandra.Client({ contactPoints: ['localhost'] })

client.execute('select key from system.local', (err, result) => {
  if (err) throw err
  console.log(result.rows[0])
})

const articles = require("./data/db.json");
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.use(express.json());

function articleFieldsValidations() {
  return [
    body("article")
      .escape()
      .isLength({ min: 5, max: 255 })
      .withMessage("Le nom doit avoir entre 5 et 255 caracteres"),

    body("description")
      .escape()
      .isLength({ min: 5, max: 500 })
      .withMessage("La description doit avoir entre 5 et 500 caracteres"),

    body("author")
      .escape()
      .isLength({ min: 2, max: 50 })
      .withMessage("Le nom de l'auteur doit avoir entre 2 et 50 caractere"),

    body("content")
      .escape()
      .isLength({ min: 5, max: 500 })
      .withMessage("Le contenu doit avoir entre 5 et 500 caracteres"),

  body("url")
  .escape()
  .isLength({ min: 5, max: 10 })
  .withMessage("Le url doit avoir entre 5 et 10 caracteres"),
];

}

function updateDBJSON(array) {
  fs.writeFileSync("./data/db.json", JSON.stringify(array, null, 2));
}


app.get("/", (req, res) => {
  res.render("index");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/article/update/:slug", (req, res)=>{
   const { slug } = req.params;
  const article = articles.find((article) => article.slug === slug);

  if (article) {
    res.render("updateArticle", { article });
  } else {
    res.render("404");
  }

})

app.get("/about", (req, res) => {
  res.render("about");
});
app.get("/articles", (req, res) => {
  res.render("articles", { articles });
});

app.delete("/articles/:slug", (req, res) => {
  const { slug } = req.params;

  const articleIndex = articles.findIndex((article) => article.slug === slug);
  articles.splice(articleIndex, 1);
  updateDBJSON(articles);
  res.send("ok");
});

app.post("/articles", articleFieldsValidations(), (req, res) => {
  const article = req.body;

  const result = validationResult(req);

  console.log(result.errors);
  if (result.errors.length === 0) {
    article.slug = article.title.toLowerCase().replace(" ", "-");
    article.publishedAt = new Date();

    articles.push(article);
    updateDBJSON(articles);
    res.send("ok");
  } else {
    res.statusCode = 400;
  }
});

app.put("/articles/:slug", articleFieldsValidations(), (req, res) => {
  const { slug } = req.params;
  const { title, author, content, description, urlToImage } = req.body;

  const articleIndex = articles.findIndex((article) => article.slug === slug);
  if (articleIndex < 0) {
    return res.status(404).send("Not found");
  }

  console.log("in");

  articles[articleIndex].title = title;
  articles[articleIndex].content = content;
  articles[articleIndex].author = author;
  articles[articleIndex].description = description;
  articles[articleIndex].urlToImage = urlToImage;
  articles[articleIndex].updateAt = new Date();

  updateDBJSON(articles);
});

app.get("/articles/:slug", (req, res) => {
  const { slug } = req.params;
  const article = articles.find((article) => article.slug === slug);

  if (article) {
    res.render("article", { article });
  } else {
    res.render("404");
  }
});

app.get("/article/add", (req, res) => {
  res.render("addArticle");
});

app.get("/*", (req, res, next) => {
  res.render("404");
});

const port = 3000;

app.listen(port, function () {
  console.log(`l'application ecoute sur le port ${port}`);
  console.log(`l'application est disponible sur http://localhost:${port}`);
});
