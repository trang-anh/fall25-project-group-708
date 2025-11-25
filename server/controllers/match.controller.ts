import express, { Response } from 'express';
import {
  CreateMatchRequest,
  GetUserMatchesRequest,
  MatchRequest,
  FakeSOSocket,
  DeleteMatchRequest,
  MatchProfileRequest,
  UpdateMatchStatusRequest,
} from '../types/types';
import {
  createMatch,
  deleteMatch,
  generateMatchRecommendation,
  getMatch,
  getUserMatches,
  updateMatchStatus,
} from '../services/match.service';

/**
 * Controller for handling match-related routes.
 *
 * @param socket - The socket instance used to emit match update events.
 * @returns An Express router with all match endpoints registered.
 */
const matchController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Retrieves a match by its ID.
   *
   * @param req - The request object containing the matchId parameter
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const getMatchRoute = async (req: MatchRequest, res: Response): Promise<void> => {
    const { matchId } = req.params;

    try {
      const foundMatch = await getMatch(matchId);

      if ('error' in foundMatch) {
        throw new Error(foundMatch.error);
      }

      res.json(foundMatch);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving match: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves all user matches.
   
   * @param _req - The express request object 
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const getUserMatchesRoute = async (req: GetUserMatchesRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const result = await getUserMatches(userId);

      if ('error' in result) {
        res.status(500).json({ error: result.error });
        return;
      }

      // Convert ObjectIds → strings for OpenAPI validation
      const cleaned = result.map(match => ({
        ...match,
        _id: match._id.toString(),
        userA: match.userA.toString(),
        userB: match.userB.toString(),
        initiatedBy: match.initiatedBy?.toString() ?? null,
      }));

      res.json(cleaned);
      return;
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving all user matches: ${(err as Error).message}`);
    }
  };

  /**
   * Creates a new match between two users.
   *
   * @param req - The request object containing match details (userA, userB, etc.)
   * @param res - The response object used to send back the result
   */
  const createMatchRoute = async (req: CreateMatchRequest, res: Response): Promise<void> => {
    const { userA, userB, status, score, initiatedBy } = req.body;

    try {
      const savedMatch = await createMatch({
        userA,
        userB,
        status,
        score,
        initiatedBy,
      });

      if ('error' in savedMatch) {
        throw new Error(savedMatch.error);
      }

      socket.emit('matchUpdate', {
        type: 'created',
        match: savedMatch,
      });

      res.json(savedMatch);
    } catch (err: unknown) {
      res.status(500).send(`Error creating a match: ${(err as Error).message}`);
    }
  };

  /**
   * Deletes a match if the requester is one of the users.
   *
   * @param req - The request object containing matchId and username
   * @param res - The response object used to send back the result
   * @returns {Promise<void>} - A promise that resolves when the response has been sent
   */
  const deleteMatchRoute = async (req: DeleteMatchRequest, res: Response): Promise<void> => {
    const { matchId } = req.params;
    const { userId } = req.body;

    try {
      const result = await deleteMatch(matchId, userId);

      if ('error' in result) {
        // Determine appropriate status code based on error
        if (result.error.includes('Unauthorized')) {
          res.status(403).json({ error: result.error });
        } else if (result.error.includes('not found')) {
          res.status(404).json({ error: result.error });
        } else {
          res.status(500).json({ error: result.error });
        }
        return;
      }

      socket.emit('matchUpdate', {
        type: 'deleted',
        match: result,
      });

      res.json({ match: result, message: 'Match deleted successfully' });
    } catch (err: unknown) {
      res.status(500).json({ error: `Error deleting match: ${(err as Error).message}` });
    }
  };

  /**
   * Updates the status of an existing match (accept or decline).
   *
   * @param req - The request containing matchId in params and userId/status in body
   * @param res - The response object used to send back the result
   * @returns {Promise<void>}
   */
  const updateMatchStatusRoute = async (
    req: UpdateMatchStatusRequest,
    res: Response,
  ): Promise<void> => {
    const { matchId } = req.params;
    const { userId, status } = req.body;

    try {
      const updated = await updateMatchStatus(matchId, userId, status);

      if ('error' in updated) {
        if (updated.error.includes('Unauthorized')) {
          res.status(403).json({ error: updated.error });
        } else if (updated.error.includes('not found')) {
          res.status(404).json({ error: updated.error });
        } else {
          res.status(500).json({ error: updated.error });
        }
        return;
      }

      socket.emit('matchUpdate', {
        type: 'updated',
        match: updated,
      });

      res.json(updated);
    } catch (err: unknown) {
      res.status(500).json({
        error: `Error updating match status: ${(err as Error).message}`,
      });
    }
  };

  /**
   * Generates match recommendations for a user.
   * Returns recommended profiles sorted by compatibility.
   *
   * @param req - Express request containing `userId` in params.
   * @param res - Express response used to send the result.
   */
  const generateMatchRecommendationsRoute = async (
    req: MatchProfileRequest,
    res: Response,
  ): Promise<void> => {
    const { userId } = req.params;

    try {
      const result = await generateMatchRecommendation(userId);

      if ('error' in result) {
        res.status(500).json({ error: result.error });
        return;
      }

      if (!result.recommendations || result.recommendations.length === 0) {
        res.json({ recommendations: [], message: 'No recommendations found' });
        return;
      }

      const cleaned = result.recommendations.map(rec => ({
        userId: rec.userId,
        score: rec.score,
        profile: {
          ...rec.profile,
          _id: rec.profile._id.toString(),
          userId: {
            _id: rec.profile.userId._id.toString(),
            username: rec.profile.userId.username,
          },
          programmingLanguage: rec.profile.programmingLanguage,
          preferences: {
            ...rec.profile.preferences,
            preferredLanguages: rec.profile.preferences.preferredLanguages,
          },
        },
      }));

      res.json({
        recommendations: cleaned,
        message: 'Recommendations generated successfully',
      });
    } catch (err) {
      res.status(500).json({
        error: `Error generating recommendations: ${(err as Error).message}`,
      });
    }
  };

  // Registering routes
  router.get('/getMatch/:matchId', getMatchRoute);
  router.get('/getUserMatches/:userId', getUserMatchesRoute);
  router.post('/create', createMatchRoute);
  router.patch('/updateStatus/:matchId', updateMatchStatusRoute);
  router.delete('/delete/:matchId', deleteMatchRoute);
  router.get('/recommend/:userId', generateMatchRecommendationsRoute);

  return router;
};

export default matchController;
