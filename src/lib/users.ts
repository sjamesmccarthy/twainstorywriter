import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface User {
  id: string;
  email: string;
  name: string;
  image: string;
  provider: string;
  provider_id: string;
  account_created_at: string;
  last_login_at: string;
  login_count: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
}

interface UsersData {
  users: User[];
}

const USERS_FILE_PATH = path.join(process.cwd(), "src/data/users.json");

// Helper function to read users from JSON file
export function readUsersFromFile(): User[] {
  try {
    const fileContent = fs.readFileSync(USERS_FILE_PATH, "utf8");
    const data: UsersData = JSON.parse(fileContent);
    return data.users || [];
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

// Helper function to write users to JSON file
export function writeUsersToFile(users: User[]): void {
  try {
    const data: UsersData = { users };
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing users file:", error);
    throw error;
  }
}

// Check if user is allowed (exists in users.json with active status)
export function isUserAllowed(email: string): boolean {
  const users = readUsersFromFile();
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() && u.status === "active"
  );
  return !!user;
}

// Get user by email
export function getUserByEmail(email: string): User | null {
  const users = readUsersFromFile();
  return (
    users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
  );
}

// Add or update user (for when they sign in with Google)
export function addOrUpdateUser(userInfo: {
  email: string;
  name: string;
  image?: string;
  provider_id?: string;
}): User {
  const users = readUsersFromFile();
  const existingUserIndex = users.findIndex(
    (u) => u.email.toLowerCase() === userInfo.email.toLowerCase()
  );

  const now = new Date().toISOString();

  if (existingUserIndex >= 0) {
    // Update existing user
    const existingUser = users[existingUserIndex];
    users[existingUserIndex] = {
      ...existingUser,
      name: userInfo.name,
      image: userInfo.image || existingUser.image,
      provider_id: userInfo.provider_id || existingUser.provider_id,
      last_login_at: now,
      login_count: (existingUser.login_count || 0) + 1,
      updated_at: now,
    };
    writeUsersToFile(users);
    return users[existingUserIndex];
  } else {
    // This shouldn't happen in normal flow since user should be pre-approved
    // But we'll handle it gracefully by throwing an error
    throw new Error(
      "User not found in allowed list. Please request access first."
    );
  }
}

// Add new user to the allowed list (admin function)
export function addUserToAllowedList(userInfo: {
  email: string;
  name: string;
  isAdmin?: boolean;
}): User {
  const users = readUsersFromFile();
  const existingUser = users.find(
    (u) => u.email.toLowerCase() === userInfo.email.toLowerCase()
  );

  if (existingUser) {
    throw new Error("User already exists");
  }

  const now = new Date().toISOString();
  const newUser: User = {
    id: uuidv4(),
    email: userInfo.email.toLowerCase(),
    name: userInfo.name,
    image: "",
    provider: "google",
    provider_id: "",
    account_created_at: now,
    last_login_at: "",
    login_count: 0,
    status: "active",
    created_at: now,
    updated_at: now,
    is_admin: userInfo.isAdmin || false,
  };

  users.push(newUser);
  writeUsersToFile(users);
  return newUser;
}

// Remove user from allowed list
export function removeUserFromAllowedList(email: string): boolean {
  const users = readUsersFromFile();
  const userIndex = users.findIndex(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (userIndex >= 0) {
    users.splice(userIndex, 1);
    writeUsersToFile(users);
    return true;
  }

  return false;
}

// Check if user is admin
export function isUserAdmin(email: string): boolean {
  const user = getUserByEmail(email);
  return user?.is_admin === true;
}

// Get all users
export function getAllUsers(): User[] {
  return readUsersFromFile();
}
