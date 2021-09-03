const { assert } = require('chai');
const { retrieveUser } = require('../helpers.js');

const testUsers = {
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
  
};
describe('retrieveUser', function() {
  it('should return a user with valid email', function() {
    const user = retrieveUser("user@example.com", testUsers);
    const expectedOutput = {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(user, expectedOutput);
  });

  it('should return undefined with an invalid email', function() {
    const user = retrieveUser("invalid@user.com", testUsers);
    assert.isUndefined(user);
  });
});