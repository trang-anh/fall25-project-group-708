import axios from 'axios';
import { UserCredentials, SafeDatabaseUser } from '../types/types';
import api from './config';

const USER_API_URL = `/api/user`;
const AUTH_API_URL = `/api/auth`;

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUsers = async (): Promise<SafeDatabaseUser[]> => {
  const res = await api.get(`${USER_API_URL}/getUsers`);
  if (res.status !== 200) {
    throw new Error('Error when fetching users');
  }
  return res.data;
};

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUserByUsername = async (username: string): Promise<SafeDatabaseUser> => {
  const res = await api.get(`${USER_API_URL}/getUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching user');
  }
  return res.data;
};

/**
 * Sends a POST request to create a new user account.
 *
 * @param user - The user credentials (username and password) for signup.
 * @returns {Promise<User>} The newly created user object.
 * @throws {Error} If an error occurs during the signup process.
 */
const createUser = async (user: UserCredentials): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/signup`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while signing up: ${error.response.data}`);
    } else {
      throw new Error('Error while signing up');
    }
  }
};

/**
 * Sends a POST request to authenticate a user.
 *
 * @param user - The user credentials (username and password) for login.
 * @returns {Promise<User>} The authenticated user object.
 * @throws {Error} If an error occurs during the login process.
 */
const loginUser = async (user: UserCredentials): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.post(`${USER_API_URL}/login`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while logging in: ${error.response.data}`);
    } else {
      throw new Error('Error while logging in');
    }
  }
};

/**
 * Deletes a user by their username.
 * @param username - The unique username of the user
 * @returns A promise that resolves to the deleted user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const deleteUser = async (username: string): Promise<SafeDatabaseUser> => {
  const res = await api.delete(`${USER_API_URL}/deleteUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when deleting user');
  }
  return res.data;
};

/**
 * Resets the password for a user.
 * @param username - The unique username of the user
 * @param newPassword - The new password to be set for the user
 * @returns A promise that resolves to the updated user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const resetPassword = async (username: string, newPassword: string): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/resetPassword`, {
    username,
    password: newPassword,
  });
  if (res.status !== 200) {
    throw new Error('Error when resetting password');
  }
  return res.data;
};

/**
 * Updates the user's biography.
 * @param username The unique username of the user
 * @param newBiography The new biography to set for this user
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const updateBiography = async (
  username: string,
  newBiography: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateBiography`, {
    username,
    biography: newBiography,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating biography');
  }
  return res.data;
};

/**
 * initiates GitHub OAuth authentication by redirecting to GitHub
 */
const loginWithGithub = (): void => {
  window.location.href = `${window.location.protocol}//${window.location.hostname}:8000${AUTH_API_URL}/github`;
};

/**
 * checks the current authentication status and retrieves the logged-in user
 *
 * @returns {Promise<SafeDatabaseUser>} the currently authenticated user object
 * @throws {Error} If the user is not authenticated or if an error occurs
 */
const getCurrentUser = async (): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.get(`${AUTH_API_URL}/user`);
    if (res.status !== 200) {
      throw new Error('Not authenticated');
    }
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Error fetching the current user: ${error.response.data.error || 'Not authenticated'}`,
      );
    } else {
      throw new Error('Error fetching new user');
    }
  }
};

/**
 * logs out of the current user
 *
 * @returns {Promise<void>}
 * @throws {Error} if an error occurs during logs out
 */
const logoutUser = async (): Promise<void> => {
  try {
    const res = await api.post(`${AUTH_API_URL}/logout`);
    if (res.status !== 200) {
      throw new Error('Error during logout');
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while logging out: ${error.response.data.error || 'Logout failed'}`);
    } else {
      throw new Error('Error while logging out');
    }
  }
};

/**
 * find users with matching skills
 * @params skills - names of languages to be matched
 * @returns a promise resolving to users with matching skills
 * @throws error if the request fails
 */
const findUsersBySkills = async (skills: string[]): Promise<SafeDatabaseUser[]> => {
  try {
    const res = await api.post(`${USER_API_URL}/findBySkills`, { skills });
    if (res.status !== 200) {
      throw new Error('Error when finding users by skills');
    }
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error finding users: ${error.response.data}`);
    } else {
      throw new Error('Error finding users by skills');
    }
  }
};

export {
  getUsers,
  getUserByUsername,
  loginUser,
  createUser,
  deleteUser,
  resetPassword,
  updateBiography,
  loginWithGithub,
  getCurrentUser,
  logoutUser,
  findUsersBySkills,
};
