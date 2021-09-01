const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  let randLower = Math.random().toString(36).slice(-6);
  let randString = "";
  for (const character of randLower) {
    if (Number(character) == character || Math.random() > 0.5) {
      randString += character;
    } else {
      randString += character.toUpperCase();
    }
  }
  return randString;
}

const retrieveUser = (userEmail, userDb) => {
  return Object.values(userDb).find(user => user.email === userEmail);
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies.username
  };
  res.render("urls_index", templateVars);
});
app.post("/urls", (req, res) => {
  const genShortURL = generateRandomString();
  urlDatabase[genShortURL] = req.body.longURL;
  res.redirect(`/urls/${genShortURL}`);
});
app.get("/urls/new", (req, res) => {
  res.render("urls_new", { username: req.cookies.username });
});
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies.username
  };
  res.render("urls_show", templateVars);
});
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect(`/urls/`);
});
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect(req.headers.referer);
});
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect(req.headers.referer);
});

app.get('/register', (req, res) => {
  res.render('register', { username: req.cookies.username })
});
app.post('/register', (req, res) => {
  if (retrieveUser(req.body.email, users)) {
    return;
  }
  const assignedId = generateRandomString();
  const {email, password} = req.body;
  users[assignedId] = {id: assignedId, email, password};

  res.cookie('user_id', assignedId);
  console.log(users)
  res.redirect('/urls')
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});