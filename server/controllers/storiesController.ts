import { Request, Response } from 'express';
import { storage } from '../mongoStorageWorking';

export async function getStoriesController(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    const stories = await storage.getStories(userId);
    res.json(stories);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createStoryController(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { content, imageUrl, videoUrl } = req.body;

    if (!content && !imageUrl && !videoUrl) {
      return res.status(400).json({ message: 'Content, imageUrl, or videoUrl is required' });
    }

    const story = await storage.createStory({
      userId,
      content,
      imageUrl,
      videoUrl,
    });

    res.status(201).json({
      message: 'Story created successfully',
      story
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteStoryController(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Story ID is required' });
    }

    const deleted = await storage.deleteStory(id, userId);

    if (!deleted) {
      return res.status(404).json({ message: 'Story not found or unauthorized' });
    }

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
