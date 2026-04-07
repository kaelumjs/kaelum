// controllers/usersController.js
// Simple in-memory controller for Kaelum API demonstration

const users = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "user" },
];

exports.list = (req, res) => res.json(users);

exports.create = (req, res) => {
  const newUser = { id: users.length + 1, ...req.body };
  users.push(newUser);
  res.status(201).json({ success: true, user: newUser });
};

exports.get = (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  return user ? res.json(user) : res.status(404).json({ error: "User not found" });
};

exports.posts = (req, res) => {
  res.json([
    { id: 101, title: "Kaelum Rocks", userId: req.params.id },
    { id: 102, title: "Recursive Routing", userId: req.params.id },
  ]);
};
