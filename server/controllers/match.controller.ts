import express, { Response } from 'express';
import {
  CreateMatchRequest,
  GetUserMatchesRequest,
  MatchRequest,
  FakeSOSocket,
  DeleteMatchRequest,
  MatchProfileRequest,
} from '../types/types';
import {
  createMatch,
  deleteMatch,
  generateMatchRecommendation,
  getMatch,
  getUserMatches,
} from '../services/match.service';

/**
 * This controller handles match-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the match routes.
 * @throws {Error} Throws an error if the match operations fail.
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
   * Generates matches for a user and emits matchUpdate events for each match.
   */
  /**
   * Generates matches for a user, emits matchUpdate events,
   * and returns the list of generated matches.
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
  router.delete('/delete/:matchId', deleteMatchRoute);
  router.get('/recommend/:userId', generateMatchRecommendationsRoute);

  return router;
};

export default matchController;
