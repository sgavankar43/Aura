import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);

  try {
    const logs = await prisma.auditLog.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.auditLog.count({ where: { projectId: id } });

    res.json({
      data: logs,
      meta: {
        page,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}
