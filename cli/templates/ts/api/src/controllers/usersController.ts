// controllers/usersController.ts
// Simple in-memory controller for Kaelum API demonstration

interface User {
  id: number;
  name: string;
  role: string;
}

const users: User[] = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "user" },
];

// Uses res.ok / res.created / res.notFound from app.useResponseHelpers()
const list = (req: any, res: any): void => {
  res.ok(users);
};

const create = (req: any, res: any): void => {
  const newUser: User = { id: users.length + 1, ...req.body };
  users.push(newUser);
  res.created({ success: true, user: newUser });
};

const getById = (req: any, res: any): void => {
  const user = users.find((u: User) => u.id === Number(req.params.id));
  if (user) {
    res.ok(user);
  } else {
    res.notFound("User not found");
  }
};

const posts = (req: any, res: any): void => {
  res.ok([
    { id: 101, title: "Kaelum Rocks", userId: req.params.id },
    { id: 102, title: "Recursive Routing", userId: req.params.id },
  ]);
};

export { list, create, getById, posts };
