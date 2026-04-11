import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export async function listProjects(_req: Request, res: Response): Promise<void> {
  try {
    const projects = await prisma.project.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list projects' });
  }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const { name, description } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Project name is required' });
    return;
  }

  try {
    const project = await prisma.project.create({
      data: { name, description },
    });

    // Log creation
    await prisma.auditLog.create({
      data: {
        action: 'project.created',
        entity: 'Project',
        entityId: project.id,
        userId: req.user!.userId,
        projectId: project.id,
      },
    });

    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { environments: true, features: true },
    });

    if (!project || project.archivedAt) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get project' });
  }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const project = await prisma.project.update({
      where: { id },
      data: { name, description },
    });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
}

export async function archiveProject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const project = await prisma.project.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive project' });
  }
}

// Environments
export async function listEnvironments(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const environments = await prisma.environment.findMany({
      where: { projectId: id },
    });
    res.json({ environments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get environments' });
  }
}

export async function createEnvironment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, slug, color } = req.body;

  if (!name || !slug) {
    res.status(400).json({ error: 'Name and slug required' });
    return;
  }

  try {
    const env = await prisma.environment.create({
      data: { name, slug, color, projectId: id },
    });
    res.status(201).json({ environment: env });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create environment' });
  }
}
