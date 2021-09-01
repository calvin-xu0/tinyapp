const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };
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
};

const urlsForUser = (id) => {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL]
    }
  }
  return userURLs;
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    // return res.redirect('/login');
    res.status(401).send('Log in to view your shortened URLs')
  }

  // const userURLs = {};
  // const id = req.cookies.user_id.id;
  // for (const shortURL in urlDatabase) {
  //   if (urlDatabase[shortURL].userID === id) {
  //     userURLs[shortURL] = urlDatabase[shortURL]
  //   }
  // }
  
  const templateVars = {
    urls: urlsForUser(req.cookies.user_id.id),
    user: req.cookies.user_id
  };
  res.render("urls_index", templateVars);
});
app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(401).send('You must be logged in to shorten URLs')
  }
  const genShortURL = generateRandomString();
  urlDatabase[genShortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id.id
  };
  res.redirect(`/urls/${genShortURL}`);
});
app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect('/login');
  }
  res.render("urls_new", { user: req.cookies.user_id });
});
app.get("/urls/:shortURL", (req, res) => {
  if (req.cookies.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    return res.redirect('/urls');
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: req.cookies.user_id
  };
  res.render("urls_show", templateVars);
});
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = {
    longURL: req.body.newURL,
    userID: req.cookies.user_id.id
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
  // Unrestricted access
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get('/login', (req, res) => {
  res.render('login', { user: req.cookies.user_id });
})
app.post("/login", (req, res) => {
  const foundUser = retrieveUser(req.body.email, users);
  if (!foundUser || foundUser.password !== req.body.password) {
    return res.status(403).send('Invalid credentials');
  }
  res.cookie('user_id', foundUser);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(req.headers.referer);
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.cookies.user_id })
});
app.post('/register', (req, res) => {
  if (retrieveUser(req.body.email, users) || Object.values(req.body).some(entry => entry.length === 0)) {
    return res.status(400).send('Invalid registration fields');
  }

  const {email, password} = req.body;
  const assignedId = generateRandomString();
  users[assignedId] = {id: assignedId, email, password};

  res.cookie('user_id', users[assignedId]);
  res.redirect('/urls')
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});