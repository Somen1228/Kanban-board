import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import Board from '../models/Board.js';

const router = Router();

// All board routes require authentication
router.use(authenticate);

/**
 * GET /api/boards
 * Get all boards for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const boards = await Board.findAll({
      where: { user_id: req.user.id },
      order: [['position', 'ASC'], ['created_at', 'ASC']],
    });

    const formattedBoards = boards.map((board) => ({
      id: board.id,
      title: board.title,
      cards: board.cards,
      position: board.position,
    }));

    res.json({ boards: formattedBoards });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

/**
 * POST /api/boards
 * Create a new board
 */
router.post('/', async (req, res) => {
  try {
    const { id, title, cards } = req.body;

    // Get the max position for ordering
    const maxPosition = await Board.max('position', {
      where: { user_id: req.user.id },
    });

    const board = await Board.create({
      id: id || undefined,
      user_id: req.user.id,
      title: title || 'Untitled',
      cards: cards || [],
      position: (maxPosition || 0) + 1,
    });

    res.status(201).json({
      board: {
        id: board.id,
        title: board.title,
        cards: board.cards,
        position: board.position,
      },
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

/**
 * PUT /api/boards/:id
 * Update a board (title and/or cards)
 */
router.put('/:id', async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const { title, cards, position } = req.body;

    if (title !== undefined) board.title = title;
    if (cards !== undefined) board.cards = cards;
    if (position !== undefined) board.position = position;

    await board.save();

    res.json({
      board: {
        id: board.id,
        title: board.title,
        cards: board.cards,
        position: board.position,
      },
    });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ error: 'Failed to update board' });
  }
});

/**
 * DELETE /api/boards/:id
 * Delete a board
 */
router.delete('/:id', async (req, res) => {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    await board.destroy();
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

/**
 * PUT /api/boards
 * Bulk sync all boards (used for full state sync)
 */
router.put('/', async (req, res) => {
  try {
    const { boards } = req.body;

    if (!Array.isArray(boards)) {
      return res.status(400).json({ error: 'boards must be an array' });
    }

    // Get existing board IDs for this user
    const existingBoards = await Board.findAll({
      where: { user_id: req.user.id },
      attributes: ['id'],
    });
    const existingIds = new Set(existingBoards.map((b) => b.id));
    const incomingIds = new Set(boards.map((b) => b.id));

    // Delete boards that are no longer present
    const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
    if (toDelete.length > 0) {
      await Board.destroy({
        where: { id: toDelete, user_id: req.user.id },
      });
    }

    // Upsert each board
    for (let i = 0; i < boards.length; i++) {
      const boardData = boards[i];
      await Board.upsert({
        id: boardData.id,
        user_id: req.user.id,
        title: boardData.title,
        cards: boardData.cards,
        position: i,
      });
    }

    res.json({ message: 'Boards synced successfully' });
  } catch (error) {
    console.error('Sync boards error:', error);
    res.status(500).json({ error: 'Failed to sync boards' });
  }
});

export default router;
