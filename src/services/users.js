const usersQueries = require('../db/queries/users');
const { sendEmail } = require('./email');
const { validateEmail, isNonEmptyString } = require('../utils/validation');
const { isUniqueViolation } = require('../utils/sqlite-errors');

function listUsers() {
  return usersQueries.findAllUsers();
}

function getUserById(id) {
  const user = usersQueries.findUserById(id);
  if (!user) throw { status: 404, message: 'User not found' };
  return user;
}

async function createUser({ name, email }) {
  if (!isNonEmptyString(name)) throw { status: 400, message: 'name is required' };
  if (!isNonEmptyString(email)) throw { status: 400, message: 'email is required' };
  if (!validateEmail(email)) throw { status: 400, message: 'Invalid email address' };

  let id;
  try {
    id = usersQueries.insertUser({ name, email });
  } catch (err) {
    if (isUniqueViolation(err)) throw { status: 409, message: 'email already exists' };
    throw err;
  }
  const user = usersQueries.findUserById(id);

  await sendEmail({
    to: user.email,
    subject: 'Welcome to Taskr!',
    body: `Hi ${user.name}, your account is ready. Start managing your tasks at taskr.io.`
  });

  return user;
}

function updateUser(id, data) {
  const existing = getUserById(id);
  usersQueries.updateUser(id, {
    name: data.name !== undefined ? data.name : existing.name,
    email: data.email !== undefined ? data.email : existing.email
  });
  return usersQueries.findUserById(id);
}

function deleteUser(id) {
  if (usersQueries.deleteUser(id) === 0) throw { status: 404, message: 'User not found' };
  return { deleted: true };
}

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };
