// controllers/usersController.js
// Simple in-memory controller for Kaelum API demonstration

const users = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "user" },
];

// Uses res.ok / res.created / res.notFound from app.useResponseHelpers()
exports.list = (req, res) => res.ok(users);

exports.create = (req, res) => {
  const newUser = { id: users.length + 1, ...req.body };
  users.push(newUser);
  res.created({ success: true, user: newUser });
};

exports.get = (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  return user ? res.ok(user) : res.notFound("User not found");
};

exports.posts = (req, res) => {
  res.ok([
    { id: 101, title: "Kaelum Rocks", userId: req.params.id },
    { id: 102, title: "Recursive Routing", userId: req.params.id },
  ]);
};
