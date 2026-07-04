const { now } = require('../utils/helpers');

const users = new Map();
let userIdCounter = 1;

users.set(userIdCounter, {
  id: userIdCounter,
  name: 'Jane Doe',
  email: 'jane@example.com',
  createdAt: now()
});

function getAllUsers() {
  return Array.from(users.values());
}

function createUser({ name, email }) {
  if (!name || !email) {
    return { error: 'Name and email are required', status: 400 };
  }

  const id = ++userIdCounter;
  const user = {
    id,
    name,
    email,
    createdAt: now()
  };
  users.set(id, user);
  return { user, status: 201 };
}

function resetUsers() {
  users.clear();
  userIdCounter = 1;
  users.set(userIdCounter, {
    id: userIdCounter,
    name: 'Jane Doe',
    email: 'jane@example.com',
    createdAt: now()
  });
}

module.exports = {
  getAllUsers,
  createUser,
  resetUsers
};