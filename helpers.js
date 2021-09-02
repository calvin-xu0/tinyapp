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

const urlsForUser = (id, urlDatabase) => {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL]
    }
  }
  return userURLs;
};

module.exports = { generateRandomString, retrieveUser, urlsForUser }