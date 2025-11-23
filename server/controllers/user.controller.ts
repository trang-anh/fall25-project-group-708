import express, { CookieOptions, Request, Response, Router } from 'express';
import { uploadAvatar, deleteAvatar } from './avatar.controller';
import avatarUpload from '../utils/multer.config';

import {
  UserRequest,
  User,
  UserCredentials,
  UserByUsernameRequest,
  FakeSOSocket,
  UpdateBiographyRequest,
  SafeDatabaseUser,
} from '../types/types';
import {
  deleteUserByUsername,
  getUserByUsername,
  getUsersList,
  loginUser,
  saveUser,
  updateUser,
} from '../services/user.service';
import {
  disable2FA,
  generate2FACode,
  is2FAEnabled,
  verifyAndEnable2FA,
} from '../services/twoFactor.service';
import {
  SESSION_COOKIE_NAME,
  createSession,
  deleteSession,
  getSessionTtl,
  invalidateUserSessions,
} from '../services/session.service';
import { getSessionIdFromRequest } from '../utils/sessionCookie';

const userController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();

  /**
   * Handles the creation of a new user account.
   * @param req The request containing username, email, and password in the body.
   * @param res The response, either returning the created user or an error.
   * @returns A promise resolving to void.
   */
  const createUser = async (req: UserRequest, res: Response): Promise<void> => {
    const requestUser = req.body;

    const user: User = {
      ...requestUser,
      dateJoined: new Date(),
      biography: requestUser.biography ?? '',
    };

    try {
      const result = await saveUser(user);

      if ('error' in result) {
        throw new Error(result.error);
      }

      socket.emit('userUpdate', {
        user: result,
        type: 'created',
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when saving user: ${error}`);
    }
  };

  /**
   * Handles user login by validating credentials.
   * @param req The request containing username and password in the body.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const userLogin = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      const loginCredentials: UserCredentials = {
        username: req.body.username,
        password: req.body.password,
      };
      const rememberDevice = Boolean(req.body.rememberDevice);

      const user = await loginUser(loginCredentials);

      if ('error' in user) {
        throw Error(user.error);
      }

      invalidateUserSessions(user as SafeDatabaseUser);

      const existingSessionId = getSessionIdFromRequest(req);
      if (existingSessionId) {
        deleteSession(existingSessionId);
      }

      const { sessionId } = createSession(user as SafeDatabaseUser, getSessionTtl(), {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      const cookieOptions: CookieOptions = {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      };

      if (rememberDevice) {
        cookieOptions.maxAge = getSessionTtl();
      }

      res.cookie(SESSION_COOKIE_NAME, sessionId, cookieOptions);

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send('Login failed');
    }
  };

  /**
   * Retrieves a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either returning the user or an error.
   * @returns A promise resolving to void.
   */
  const getUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;

      const user = await getUserByUsername(username);

      if ('error' in user) {
        throw Error(user.error);
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).send(`Error when getting user by username: ${error}`);
    }
  };

  /**
   * Retrieves all users from the database.
   * @param res The response, either returning the users or an error.
   * @returns A promise resolving to void.
   */
  const getUsers = async (_: Request, res: Response): Promise<void> => {
    try {
      const users = await getUsersList();

      if ('error' in users) {
        throw Error(users.error);
      }

      res.status(200).json(users);
    } catch (error) {
      res.status(500).send(`Error when getting users: ${error}`);
    }
  };

  /**
   * Deletes a user by their username.
   * @param req The request containing the username as a route parameter.
   * @param res The response, either confirming deletion or returning an error.
   * @returns A promise resolving to void.
   */
  const deleteUser = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;

      const deletedUser = await deleteUserByUsername(username);

      if ('error' in deletedUser) {
        throw Error(deletedUser.error);
      }

      socket.emit('userUpdate', {
        user: deletedUser,
        type: 'deleted',
      });
      res.status(200).json(deletedUser);
    } catch (error) {
      res.status(500).send(`Error when deleting user by username: ${error}`);
    }
  };

  /**
   * Resets a user's password.
   * @param req The request containing the username and new password in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const resetPassword = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      const updatedUser = await updateUser(req.body.username, { password: req.body.password });

      if ('error' in updatedUser) {
        throw Error(updatedUser.error);
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user password: ${error}`);
    }
  };

  /**
   * Updates a user's biography.
   * @param req The request containing the username and biography in the body.
   * @param res The response, either confirming the update or returning an error.
   * @returns A promise resolving to void.
   */
  const updateBiography = async (req: UpdateBiographyRequest, res: Response): Promise<void> => {
    try {
      // Validate that request has username and biography
      const { username, biography } = req.body;

      // Call the same updateUser(...) service used by resetPassword
      const updatedUser = await updateUser(username, { biography });

      if ('error' in updatedUser) {
        throw new Error(updatedUser.error);
      }

      // Emit socket event for real-time updates
      socket.emit('userUpdate', {
        user: updatedUser,
        type: 'updated',
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).send(`Error when updating user biography: ${error}`);
    }
  };

  /**
   * Generates a new 2FA code for the specified user.
   * @param req The request containing username as a route parameter.
   * @param res The response, either returning the code or an error.
   */
  const generate2FA = async (
    req: Request<{ username: string }, unknown, { email?: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const { username } = req.params;
      const { email } = req.body || {};
      const result = await generate2FACode(username, email);

      if ('error' in result) {
        res.status(400).json(result);
        return;
      }

      // for testing displays code in response
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: `Error generating 2FA code: ${error}` });
    }
  };

  /**
   * Enables 2FA after verifying the code.
   * @param req The request body containing username and code.
   * @param res The response, returning updated user data or an error.
   */
  const enable2FA = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, code } = req.body;
      if (!username || !code) {
        res.status(400).json({ error: 'Username and code are required' });
        return;
      }

      const result = await verifyAndEnable2FA(username, code);
      if ('error' in result) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: `Error enabling 2FA: ${error}` });
    }
  };

  /**
   * Disables 2FA for a user.
   * @param req The request body containing username.
   * @param res The response, returning updated user data or an error.
   */
  const disable2FAHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username } = req.body;
      if (!username) {
        res.status(400).json({ error: 'Username is required' });
        return;
      }

      const result = await disable2FA(username);
      if ('error' in result) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: `Error disabling 2FA: ${error}` });
    }
  };

  /**
   * Checks if 2FA is enabled for a given user.
   * @param req The request containing username as a route parameter.
   * @param res The response with boolean flag twoFactorEnabled.
   */
  const check2FAStatus = async (req: UserByUsernameRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;
      const enabled = await is2FAEnabled(username);
      res.status(200).json({ twoFactorEnabled: enabled });
    } catch (error) {
      res.status(500).json({ error: `Error checking 2FA status: ${error}` });
    }
  };

  // Define routes for the user-related operations.
  router.post('/signup', createUser);
  router.post('/login', userLogin);
  router.patch('/resetPassword', resetPassword);
  router.get('/getUser/:username', getUser);
  router.get('/getUsers', getUsers);
  router.delete('/deleteUser/:username', deleteUser);
  router.patch('/updateBiography', updateBiography);
  router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);
  router.delete('/avatar', deleteAvatar);
  router.post('/2fa/generate/:username', generate2FA);
  router.post('/2fa/enable', enable2FA);
  router.post('/2fa/disable', disable2FAHandler);
  router.get('/2fa/status/:username', check2FAStatus);
  return router;
};

export default userController;
