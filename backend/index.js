import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import mainrouter from './routes/main.js';
import cors from 'cors';
import { prisma } from './prisma/client.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api", mainrouter);

// Create an HTTP server by wrapping the Express app.  This is essential for combining
// Express and WebSockets.
const server = createServer(app);

// Create a WebSocket server by attaching it to the HTTP server.
const wss = new WebSocketServer({ server });

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Use a proper session store for production.  This simple object is for development only.
const sessions = {};

// WebSocket event handling
wss.on('connection', (ws, request) => {
    console.log('Client connected');
    let userId;
    let sessionId;

    // Handle incoming messages from clients.
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('Received message:', data);

            switch (data.type) {
                case 'joinSession':
                    sessionId = data.sessionId;
                    userId = data.userId;

                    // --- Session Management ---
                    if (!sessions[sessionId]) {
                        // Fetch schema details, including workspace and members, to authorize user.
                        const schema = await prisma.schema.findUnique({
                            where: { id: sessionId },
                            include: {
                                project: {
                                    include: {
                                        workspace: {
                                            include: { members: true }
                                        }
                                    }
                                }
                            }
                        });

                        if (!schema) {
                            ws.send(JSON.stringify({ type: 'error', message: 'Schema not found' }));
                            ws.close();
                            return;
                        }

                        const isMember = schema.project.workspace.members.some(m => m.userId === userId);
                        if (!isMember) {
                            ws.send(JSON.stringify({ type: 'error', message: 'User is not a member of this workspace' }));
                            ws.close();
                            return;
                        }

                        // Initialize session data.  Crucially, store the schema ID.
                        sessions[sessionId] = {
                            schemaId: schema.id,
                            users: [],
                        };
                    }

                    // Add the user to the session.  Check for duplicates.
                    const userIndex = sessions[sessionId].users.findIndex(u => u.userId === userId);
                    if (userIndex === -1) {
                        sessions[sessionId].users.push({ userId, ws });
                    }

                    // --- Notify other users in the session ---
                    sessions[sessionId].users.forEach(user => {
                        if (user.userId !== userId && user.ws.readyState === 1) {
                            user.ws.send(JSON.stringify({ type: 'userJoined', userId: userId }));
                        }
                    });
                    break;

                case 'cursorMove':
                    sessionId = data.sessionId;
                    // Broadcast cursor position to other users in the same session.
                    if (sessions[sessionId]) {
                        sessions[sessionId].users.forEach(user => {
                            if (user.userId !== userId && user.ws.readyState === 1) {
                                user.ws.send(JSON.stringify({
                                    type: 'cursorMove',
                                    userId: userId,
                                    x: data.x,
                                    y: data.y,
                                    color: data.color,
                                }));
                            }
                        });
                    }
                    break;

                case 'schemaChange':
                    sessionId = data.sessionId;
                    if (sessions[sessionId]) {
                        switch (data.changeType) {
                            case 'updateTable':
                                const { tableId, newValues } = data;
                                try {
                                    const updatedTable = await prisma.table.update({
                                        where: { id: tableId },
                                        data: newValues,
                                    });
                                    //  Important:  Send the updated table data to other clients.
                                    sessions[sessionId].users.forEach(user => {
                                        if (user.userId !== userId && user.ws.readyState === 1) {
                                            user.ws.send(JSON.stringify({
                                                type: 'schemaChange',
                                                changeType: 'updateTable',
                                                tableId: tableId,
                                                newValues: newValues
                                            }));
                                        }
                                    });
                                } catch (e) {
                                    console.error("DB error", e);
                                    ws.send(JSON.stringify({ type: "error", message: "Database error updating table" }));
                                }
                                break;
                            // Add cases for 'createTable', 'updateColumn', 'deleteTable', etc.
                            //  Each case should:
                            //  1.  Perform the database update using Prisma.
                            //  2.  Broadcast the change to other connected clients in the session.
                            case 'createTable': {
                                const { schemaId, name, positionX, positionY } = data.newTable;
                                try {
                                  const newTable = await prisma.table.create({
                                    data: {
                                      schemaId,
                                      name,
                                      positionX,
                                      positionY,
                                    },
                                  });
                                  sessions[sessionId].users.forEach((user) => {
                                    if (user.userId !== userId && user.ws.readyState === 1) {
                                      user.ws.send(
                                        JSON.stringify({
                                          type: "schemaChange",
                                          changeType: "createTable",
                                          newTable: newTable,
                                        })
                                      );
                                    }
                                  });
                                } catch (error) {
                                  console.error("DB Error creating table", error);
                                  ws.send(
                                    JSON.stringify({
                                      type: "error",
                                      message: "Database error creating table",
                                    })
                                  );
                                }
                                break;
                              }
                            case 'updateColumn': {
                                const { columnId, name, type } = data;
                                  try {
                                    const updatedColumn = await prisma.column.update({
                                      where: { id: columnId },
                                      data: { name, type },
                                    });
                                    sessions[sessionId].users.forEach((user) => {
                                      if (user.userId !== userId && user.ws.readyState === 1) {
                                        user.ws.send(
                                          JSON.stringify({
                                            type: "schemaChange",
                                            changeType: "updateColumn",
                                            columnId: columnId,
                                            name: name,
                                            type: type
                                          })
                                        );
                                      }
                                    });
                                  } catch (error) {
                                    console.error("DB error updating column", error);
                                    ws.send(
                                      JSON.stringify({
                                        type: "error",
                                        message: "Database error updating column",
                                      })
                                    );
                                  }
                                  break;
                                }
                            case 'deleteTable':{
                                const { tableId } = data;
                                try{
                                    await prisma.table.delete({
                                        where: { id: tableId },
                                    });
                                    sessions[sessionId].users.forEach(user => {
                                        if (user.userId !== userId && user.ws.readyState === 1){
                                            user.ws.send(JSON.stringify({
                                                type: 'schemaChange',
                                                changeType: 'deleteTable',
                                                tableId: tableId
                                            }))
                                        }
                                    })

                                }
                                catch(error){
                                    console.error("DB error deleting table", error);
                                    ws.send(
                                      JSON.stringify({
                                        type: "error",
                                        message: "Database error deleting table",
                                      })
                                    );
                                }
                                break;
                            }
                        }
                    }
                    break;

                case 'message':
                    sessionId = data.sessionId;
                    //  Simple chat message broadcasting.
                    if (sessions[sessionId]) {
                        sessions[sessionId].users.forEach(user => {
                            if (user.userId !== userId && user.ws.readyState === 1) {
                                user.ws.send(JSON.stringify({
                                    type: 'message',
                                    userId: userId,
                                    message: data.message,
                                }));
                            }
                        });
                    }
                    break;

                case 'leaveSession':
                    sessionId = data.sessionId;
                    userId = data.userId;
                     if (sessions[sessionId]) {
                        // Remove user from session
                        const userIndex = sessions[sessionId].users.findIndex(u => u.userId === userId);
                        if (userIndex > -1) {
                            sessions[sessionId].users.splice(userIndex, 1);
                        }
                        // Notify other users
                        sessions[sessionId].users.forEach(user => {
                            if (user.ws.readyState === 1) {
                                user.ws.send(JSON.stringify({ type: 'userLeft', userId: userId }));
                            }
                        });
                         if (sessions[sessionId].users.length === 0) {
                            delete sessions[sessionId];
                        }
                    }
                    break;

                default:
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid message type' }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        }
    });

    // Handle client disconnects.  Clean up session data.
    ws.on('close', () => {
        console.log('Client disconnected');
         if (sessionId && userId) {
             if (sessions[sessionId])
             {
                const userIndex = sessions[sessionId].users.findIndex(u => u.userId === userId);
                 if (userIndex > -1) {
                      sessions[sessionId].users.splice(userIndex, 1);
                 }
                sessions[sessionId].users.forEach((user) => {
                  if (user.ws.readyState === 1) {
                    user.ws.send(
                      JSON.stringify({
                        type: "userLeft",
                        userId: userId,
                      })
                    );
                  }
                });
                 if (sessions[sessionId].users.length === 0) {
                      delete sessions[sessionId];
                 }
             }
         }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Start the server.  Listen on the specified port.
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
