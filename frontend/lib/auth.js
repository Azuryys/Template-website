/**
 * AUTENTICAÇÃO MOCK
 * =================
 * Este ficheiro simula um banco de dados de utilizadores
 * Para testes. No futuro, será integrado com a API real do backend.
 * 
 * CREDENCIAIS DE TESTE:
 * - Admin: admin@gmail.com / admin123
 * - User: test@gmail.com / test123
 */

// Base de dados simulada de utilizadores
const users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@gmail.com',  // 👈 Email de teste
    password: 'admin123',       // 👈 Senha de teste
    isAdmin: true              // 👈 Utilizador é administrador
  },
  {
    id: 2,
    name: 'Test User',
    email: 'test@gmail.com',    // 👈 Email de teste alternativo
    password: 'test123',        // 👈 Senha de teste alternativa
    isAdmin: false
  }
];

/**
 * FUNÇÃO: authenticateUser
 * ========================
 * Verifica se as credenciais (email + senha) são válidas
 * 
 * PARÂMETROS:
 *   - email (string): Email do utilizador
 *   - password (string): Senha do utilizador
 * 
 * RETORNA:
 *   - Objeto User (sem a senha) se credenciais forem válidas
 *   - null se credenciais forem inválidas
 */
export function authenticateUser(email, password) {
  // Procura um utilizador com email E senha coincidentes
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Remove a senha antes de retornar (por segurança)
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

/**
 * FUNÇÃO: registerUser
 * ====================
 * Regista um novo utilizador no mock database
 * 
 * PARÂMETROS:
 *   - name (string): Nome completo do utilizador
 *   - email (string): Email único
 *   - password (string): Senha em texto plano (para testes apenas!)
 * 
 * RETORNA:
 *   - Objeto User (sem senha) se registo bem-sucedido
 *   - Objeto com erro se email já existe
 */
export function registerUser(name, email, password) {
  // Verifica se o email já está registado
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return { error: 'Email já registrado' };
  }
  
  // Cria novo utilizador
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    isAdmin: false
  };
  
  // Adiciona à lista de utilizadores
  users.push(newUser);
  
  // Retorna sem a senha
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * FUNÇÃO: adminRegisterUser
 * ==========================
 * Apenas um admin pode registar novos utilizadores
 * Verifica as credenciais do admin antes de permitir o registo
 * 
 * PARÂMETROS:
 *   - adminEmail (string): Email do admin
 *   - adminPassword (string): Senha do admin
 *   - name (string): Nome do novo utilizador
 *   - email (string): Email do novo utilizador
 *   - password (string): Senha do novo utilizador
 * 
 * RETORNA:
 *   - Objeto User se registo bem-sucedido
 *   - Objeto com erro se credenciais admin inválidas ou email existe
 */
export function adminRegisterUser(adminEmail, adminPassword, name, email, password) {
  // Verifica se as credenciais do admin são válidas
  const admin = users.find(u => u.email === adminEmail && u.password === adminPassword && u.isAdmin === true);
  
  if (!admin) {
    return { error: 'Apenas administradores podem criar novos usuários' };
  }

  // Verifica se o email já está registado
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return { error: 'Email já registrado' };
  }
  
  // Cria novo utilizador
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    isAdmin: false
  };
  
  // Adiciona à lista de utilizadores
  users.push(newUser);
  
  // Retorna sem a senha
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * FUNÇÃO: isUserAdmin
 * ====================
 * Verifica se um utilizador tem privilégios de administrador
 * 
 * PARÂMETROS:
 *   - user (object): Objeto do utilizador
 * 
 * RETORNA:
 *   - true se o utilizador é admin
 *   - false caso contrário
 */
export function isUserAdmin(user) {
  return user && user.isAdmin === true;
}

/**
 * FUNÇÃO: getAllUsers
 * ====================
 * Retorna a lista de TODOS os utilizadores (sem senhas)
 * Normalmente apenas admin deveria ter acesso a isto
 * 
 * RETORNA:
 *   - Array de utilizadores (sem as senhas)
 */
export function getAllUsers() {
  return users.map(u => {
    const { password, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
}
