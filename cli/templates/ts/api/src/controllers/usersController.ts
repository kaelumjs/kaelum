// controllers/usersController.ts
// Simple in-memory controller for Kaelum API demonstration

interface User {
  id: number;
  name: string;
  role: string;
}

const users: User[] = [
  { id: 1, name: "Maria", role: "admin" },
  { id: 2, name: "Joao", role: "user" },
];

const list = (req: any, res: any): void => {
  res.json(users);
};

const create = (req: any, res: any): void => {
  const newUser: User = { id: users.length + 1, ...req.body };
  users.push(newUser);
  res.status(201).json({ success: true, user: newUser });
};

const getById = (req: any, res: any): void => {
  const user = users.find((u: User) => u.id === Number(req.params.id));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
};

const posts = (req: any, res: any): void => {
  res.json([
    { id: 101, title: "Kaelum Rocks", userId: req.params.id },
    { id: 102, title: "Recursive Routing", userId: req.params.id },
  ]);
};

export { list, create, getById, posts };
