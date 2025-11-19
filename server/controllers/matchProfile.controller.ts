import express, { Response } from 'express';
import {
  CreateMatchProfileRequest,
  MatchProfileRequest,
  ToggleMatchProfileActiveRequest,
  FakeSOSocket,
  UpdateMatchProfileRequest,
} from '../types/types';
import {
  createMatchProfile,
  getMatchProfile,
  updateMatchProfile,
  toggleMatchProfileActive,
  checkOnboardingStatus,
  getAllMatchProfiles,
} from '../services/matchProfile.service';

/**
 * This controller handles match profile-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the match profile routes.
 * @throws {Error} Throws an error if the match operations fail.
 */
const matchProfileController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Retrieves a match profile by user ID.
   *
   * @param req - The request object containing the userId parameter
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const getMatchProfileRoute = async (req: MatchProfileRequest, res: Response): Promise<void> => {
    const { userId } = req.params;

    try {
      const foundMatchProfile = await getMatchProfile(userId);

      if ('error' in foundMatchProfile) {
        throw new Error(foundMatchProfile.error);
      }

      res.json(foundMatchProfile);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving match profile: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves all match profiles.
   
   * @param _req - The express request object 
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const getAllMatchProfilesRoute = async (req: express.Request, res: Response): Promise<void> => {
    try {
      const matches = await getAllMatchProfiles();

      if ('error' in matches) {
        throw new Error(matches.error);
      }

      res.json(matches);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving all matching profile: ${(err as Error).message}`);
    }
  };

  /**
   * Creates a new match profile for a user.
   *
   * @param req - The request object containing match profile details
   * @param res - The response object used to send back the result
   */
  const createMatchProfileRoute = async (
    req: CreateMatchProfileRequest,
    res: Response,
  ): Promise<void> => {
    const {
      userId,
      isActive,
      age,
      gender,
      location,
      programmingLanguage,
      level,
      preferences,
      onboardingAnswers,
      biography,
      profileImageUrl,
    } = req.body;

    try {
      const savedMatchProfile = await createMatchProfile({
        userId,
        isActive,
        age,
        gender,
        location,
        programmingLanguage,
        level,
        preferences,
        onboardingAnswers,
        biography,
        profileImageUrl,
      });

      if ('error' in savedMatchProfile) {
        throw new Error(savedMatchProfile.error);
      }

      socket.emit('matchProfileUpdate', {
        type: 'created',
        matchProfile: savedMatchProfile,
      });

      res.json(savedMatchProfile);
    } catch (err: unknown) {
      res.status(500).send(`Error creating a match profile: ${(err as Error).message}`);
    }
  };

  /**
   * Toggles a user's active status in the matching service (unactive/active).
   *
   * @param req - The request object containing userId and active status
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const toggleMatchProfileActiveRoute = async (
    req: ToggleMatchProfileActiveRequest,
    res: Response,
  ): Promise<void> => {
    const { userId } = req.params;
    const { isActive } = req.body;

    try {
      const result = await toggleMatchProfileActive(userId, isActive);

      if ('error' in result) {
        // Handle different error types with appropriate status codes
        if (result.error.includes('not found')) {
          res.status(404).json({ error: result.error });
        } else {
          res.status(400).json({ error: result.error });
        }
        return;
      }

      socket.emit('matchProfileUpdate', {
        type: 'updated',
        matchProfile: result,
      });

      res.json(result);
    } catch (err: unknown) {
      res
        .status(500)
        .json({ error: `Error toggling match profile membership: ${(err as Error).message}` });
    }
  };

  /**
   * Updates a user's match profile.
   *
   * @param req - The request object containing userId and fields to update
   * @param res - The response object used to send back the result
   * @returns A Promise resolving to the updated match profile or an error message
   */
  const updateMatchProfileRoute = async (
    req: UpdateMatchProfileRequest,
    res: Response,
  ): Promise<void> => {
    const { userId } = req.params;
    const updates = req.body;

    try {
      const updatedProfile = await updateMatchProfile(userId, updates);

      if ('error' in updatedProfile) {
        res.status(400).json(updatedProfile);
        return;
      }

      socket.emit('matchProfileUpdate', {
        type: 'updated',
        matchProfile: updatedProfile,
      });

      res.json(updatedProfile);
    } catch (err: unknown) {
      res.status(500).json({
        error: `Error updating match profile: ${(err as Error).message}`,
      });
    }
  };

  /**
   * Checks whether a user has completed onboarding and returns their active status.
   *
   * @param req - The request object containing the userId parameter
   * @param res - The response object used to send back the result
   */
  const checkOnboardingStatusRoute = async (
    req: MatchProfileRequest,
    res: Response,
  ): Promise<void> => {
    const { userId } = req.params;

    try {
      const result = await checkOnboardingStatus(userId);

      if ('error' in result) {
        throw new Error(result.error);
      }

      res.json(result);
    } catch (err: unknown) {
      res.status(500).send(`Error checking onboarding status: ${(err as Error).message}`);
    }
  };

  // Registering routes
  router.get('/getMatchProfile/:userId', getMatchProfileRoute);
  router.get('/getAllMatchProfiles/', getAllMatchProfilesRoute);
  router.get('/checkOnboardingStatus/:userId', checkOnboardingStatusRoute);
  router.patch('/toggleMatchProfileActive/:userId', toggleMatchProfileActiveRoute);
  router.patch('/updateMatchProfile/:userId', updateMatchProfileRoute);
  router.post('/create', createMatchProfileRoute);

  return router;
};

export default matchProfileController;
