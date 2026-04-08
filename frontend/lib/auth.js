// Mock database for users
const users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: 'admin123',
    isAdmin: true
  },
  {
    id: 2,
    name: 'Test User',
    email: 'test@gmail.com',
    password: 'test123',
    isAdmin: false
  }
];

export function authenticateUser(email, password) {
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

export function registerUser(name, email, password) {
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return { error: 'Email já registrado' };
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    isAdmin: false
  };
  
  users.push(newUser);
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export function adminRegisterUser(adminEmail, adminPassword, name, email, password) {
  // Verify admin credentials
  const admin = users.find(u => u.email === adminEmail && u.password === adminPassword && u.isAdmin === true);
  
  if (!admin) {
    return { error: 'Apenas administradores podem criar novos usuários' };
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return { error: 'Email já registrado' };
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    isAdmin: false
  };
  
  users.push(newUser);
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export function isUserAdmin(user) {
  return user && user.isAdmin === true;
}

export function getAllUsers() {
  return users.map(u => {
    const { password, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
}
