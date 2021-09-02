const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const { generateRandomString, retrieveUser, urlsForUser } = require('./helpers')
const saltRounds = 10;
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", saltRounds)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", saltRounds)
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send('Log in to view your shortened URLs')
  }

  const templateVars = {
    urls: urlsForUser(req.session.user_id.id, urlDatabase),
    user: req.session.user_id
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
      return res.status(401).send('You must be logged in to shorten URLs')
  }
  const genShortURL = generateRandomString();
  urlDatabase[genShortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id.id
  };
  res.redirect(`/urls/${genShortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  res.render("urls_new", { user: req.session.user_id });
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send('Log in to modify short URLs')
  } else if (!urlDatabase[req.params.shortURL] || req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send('Short URL not found in your list')
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: req.session.user_id
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send('Log in to modify short URLs')
  }
  urlDatabase[req.params.shortURL] = {
    longURL: req.body.newURL,
    userID: req.session.user_id.id
  };
  res.redirect(`/urls/`);
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send('Invalid short URL');
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send('Log in to modify short URLs')
  } else if (!urlDatabase[req.params.shortURL] || req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send('Short URL not found in your list')
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user_id });
})
app.post("/login", (req, res) => {
  const foundUser = retrieveUser(req.body.email, users);
  if (!foundUser || !bcrypt.compareSync(req.body.password, foundUser.password)) {
    return res.status(403).send('Invalid credentials');
  }
  req.session.user_id = foundUser;
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user_id })
});

app.post('/register', (req, res) => {
  if (retrieveUser(req.body.email, users) || Object.values(req.body).some(entry => entry.length === 0)) {
    return res.status(400).send('Invalid registration fields');
  }

  const { email, password } = req.body;
  const assignedId = generateRandomString();
  users[assignedId] = { id: assignedId, email, password: bcrypt.hashSync(password, saltRounds) };

  req.session.user_id = users[assignedId];
  res.redirect('/urls')
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});