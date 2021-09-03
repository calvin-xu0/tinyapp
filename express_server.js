const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const { generateRandomString, retrieveUser, urlsForUser } = require('./helpers');
const saltRounds = 10;
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    visits: 0,
    visitLog: [],
    dateCreated: new Date(Date.now()).toDateString(undefined)
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
    visits: 0,
    visitLog: [],
    dateCreated: new Date(Date.now()).toDateString(undefined)
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
};

// Endpoints
app.get("/", (req, res) => {
  // if user is not logged in:
  if (!req.session.user_id) {
    // redirect to /login
    res.redirect('/login');
  }
  // if user is logged in: redirect to /urls
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  // if user is not logged in:
  if (!req.session.user_id) {
    // returns HTML with a relevant error message
    res.status(401).send('Log in to view your shortened URLs');
  }
  // if user is logged in:
  const templateVars = {
    urls: urlsForUser(req.session.user_id.id, urlDatabase),
    user: req.session.user_id
  };
  // returns HTML with: site header, table of URLs the user created, a link to "Create New URL"
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // if user is not logged in:
  if (!req.session.user_id) {
    // redirects to the /login page
    return res.redirect('/login');
  }
  // if user is logged in: returns HTML with: site header, form (-stretch)
  res.render("urls_new", { user: req.session.user_id });
});

app.get("/urls/:shortURL", (req, res) => {
  // if user is not logged in:
  if (!req.session.user_id) {
    // returns HTML with a relevant error message
    return res.status(401).send('Log in to modify short URLs');
    // if a URL for the given ID does not exist, or current user does not own URL:
  } else if (!urlDatabase[req.params.shortURL] || req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    // returns HTML with a relevant error message
    return res.status(403).send('Short URL not found in your list');
  }
  // if user is logged in and owns the URL for the given ID:
  const uniqueVisitors = {};
  const visitLog = urlDatabase[req.params.shortURL].visitLog;
  for (const visit of visitLog) {
    if (uniqueVisitors[visit.visitor]) {
      uniqueVisitors[visit.visitor]++;
    } else {
      uniqueVisitors[visit.visitor] = 1;
    }
  }
  console.log(uniqueVisitors)
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    visits: urlDatabase[req.params.shortURL].visits,
    visitLog,
    numUniqueVisitors: Object.keys(uniqueVisitors).length,
    user: req.session.user_id
  };
  // returns HTML with: site header, short URL, form (-stretch)
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  // if URL for the given ID does not exist:
  if (!urlDatabase[req.params.shortURL]) {
    // returns HTML with a relevant error message
    return res.status(404).send('Invalid short URL');
  }
  // if URL for the given ID exists:
  urlDatabase[req.params.shortURL].visits++;
  let logCookie = null;
  if (!req.session.user_id && !req.session.visitor_id) {
    req.session.visitor_id = req.ip;
  }
  logCookie = req.session.user_id ? req.session.user_id : req.session.visitor_id;

  const logElement = { time: Date(Date.now()).toString(), visitor: logCookie };
  urlDatabase[req.params.shortURL].visitLog.push(logElement);
  const longURL = urlDatabase[req.params.shortURL].longURL;
  // redirects to the corresponding long URL
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  // if user is not logged in:
  if (!req.session.user_id) {
    // returns HTML with a relevant error message
    return res.status(401).send('You must be logged in to shorten URLs');
  }
  // if user is logged in:
  const genShortURL = generateRandomString();
  // generates a short URL, saves it, and associates it with the user
  urlDatabase[genShortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id.id,
    visits: 0,
    visitLog: [],
    dateCreated: new Date(Date.now()).toDateString(undefined)
  };
  // redirects to /urls/:id, where :id matches the ID of the newly saved URL
  res.redirect(`/urls/${genShortURL}`);
});

app.put("/urls/:shortURL", (req, res) => {
  // if user is not logged in:
  if (!req.session.user_id) {
    // returns HTML with a relevant error message
    return res.status(401).send('Log in to modify short URLs');
    // if a URL for the given ID does not exist, or current user does not own URL:
  } else if (!urlDatabase[req.params.shortURL] || req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    // returns HTML with a relevant error message
    return res.status(403).send('Short URL not found in your list');
  }
  // if user is logged in and owns the URL for the given ID: updates the URL
  urlDatabase[req.params.shortURL].longURL = req.body.newURL;
  // redirects to /urls
  res.redirect(`/urls/`);
});

app.delete("/urls/:shortURL/delete", (req, res) => {
  // if user is not logged in:
  if (!req.session.user_id) {
    // returns HTML with a relevant error message
    return res.status(401).send('Log in to modify short URLs');
    // if a URL for the given ID does not exist, or current user does not own URL:
  } else if (!urlDatabase[req.params.shortURL] || req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    // returns HTML with a relevant error message
    return res.status(403).send('Short URL not found in your list');
  }
  // if user is logged in and owns the URL for the given ID: deletes the URL
  delete urlDatabase[req.params.shortURL];
  // redirects to /urls
  res.redirect(`/urls`);
});

app.get('/login', (req, res) => {
  // if user is logged in:
  if (req.session.user_id) {
    // redirects to /urls
    res.redirect('urls');
  }
  // if user is not logged in: returns HTML with: a form with: input fields for email + password, submit button that makes POST request to /login
  res.render('login', { user: req.session.user_id });
});

app.get('/register', (req, res) => {
  // if user is logged in:
  if (req.session.user_id) {
    // redirects to /urls
    res.redirect('urls');
  }
  // if user is not logged in: returns HTML with: a form with: input fields for email + password, submit button that makes POST request to /register
  res.render('register', { user: req.session.user_id });
});

app.post("/login", (req, res) => {
  const foundUser = retrieveUser(req.body.email, users);
  // if email and password params don't match an existing user:
  if (!foundUser || !bcrypt.compareSync(req.body.password, foundUser.password)) {
    // returns HTML with a relevant error message
    return res.status(403).send('Invalid credentials');
  }
  // if email and password params match an existing user: sets a cookie
  req.session.user_id = foundUser;
  // redirects to /urls
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  // if email or password are empty:
  if (Object.values(req.body).some(entry => entry.length === 0)) {
    // returns HTML with a relevant error message
    return res.status(400).send('Invalid registration fields');
    // if email already exists:
  } else if (retrieveUser(req.body.email, users)) {
    // returns HTML with a relevant error message
    return res.status(400).send('Email address already in use');
  }
  // otherwise:
  const { email, password } = req.body;
  const assignedId = generateRandomString();
  // creates a new user, encrypts the new user's password with bcrypt
  users[assignedId] = { id: assignedId, email, password: bcrypt.hashSync(password, saltRounds) };
  // sets a cookie
  req.session.user_id = users[assignedId];
  // redirects to /urls
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  // deletes cookie
  req.session = null;
  // redirects to /urls
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});