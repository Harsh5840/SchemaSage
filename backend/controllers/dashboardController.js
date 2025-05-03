// controllers/dashboardController.js
import prisma from '../prisma/client.js';

export const getUserDashboards = async (req, res) => {
  const userId = req.user.id; // req.user is set in verifyToken middleware

  try {
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
      include: {
        projects: true,
        members: {
          include: { user: true },
        },
      },
    });

    const memberWorkspaces = await prisma.workspaceMember.findMany({    // Fetch workspaces the user is a member of
      where: { userId },    //hamne uppar se userid li hai token se
      include: {
        workspace: {   //kyuki hamne workspaceMember se workspace data liya
          include: {
            projects: true,
            members: {   // Fetch workspace members
              include: { user: true },   // Include the users data in the workspace members like members ek array bnjayegi
            },
          },
        },
      },
    });

    const otherWorkspaces = memberWorkspaces.map(m => m.workspace);  // Map workspaces to only include the workspace data

    return res.status(200).json({
      owned: ownedWorkspaces,
      member: otherWorkspaces,
    });
  } catch (error) {
    console.error('Dashboard Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
