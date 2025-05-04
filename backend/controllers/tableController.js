// tableController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createTable = async (req, res) => {
  try {
    const { schemaId, name, positionX, positionY } = req.body;
    const newTable = await prisma.table.create({
      data: {
        schemaId,
        name,
        positionX,
        positionY
      },
    });
    res.status(201).json(newTable);
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({ error: "Failed to create table" });
  }
};

export const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        columns: true,
      },
    });
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }
    res.status(200).json(table);
  } catch (error) {
    console.error("Error getting table:", error);
    res.status(500).json({ error: "Failed to get table" });
  }
};

export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, positionX, positionY } = req.body;
    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        name,
        positionX,
        positionY
      },
    });
    res.status(200).json(updatedTable);
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({ error: "Failed to update table" });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.table.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ error: "Failed to delete table" });
  }
};



// columnController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createColumn = async (req, res) => {
    try {
        const { tableId, name, type } = req.body;
        const newColumn = await prisma.column.create({
            data: {
                tableId,
                name,
                type,
            },
        });
        res.status(201).json(newColumn);
    } catch (error) {
        console.error("Error creating column:", error);
        res.status(500).json({ error: "Failed to create column" });
    }
};

export const getColumnById = async (req, res) => {
    try {
        const { id } = req.params;
        const column = await prisma.column.findUnique({
            where: { id },
        });
        if (!column) {
            return res.status(404).json({ error: 'Column not found' });
        }
        res.status(200).json(column);
    } catch (error) {
        console.error("Error getting column:", error);
        res.status(500).json({ error: "Failed to get column" });
    }
};

export const updateColumn = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type } = req.body;
        const updatedColumn = await prisma.column.update({
            where: { id },
            data: { name, type },
        });
        res.status(200).json(updatedColumn);
    } catch (error) {
        console.error("Error updating column:", error);
        res.status(500).json({ error: "Failed to update column" });
    }
};

export const deleteColumn = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.column.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting column:", error);
        res.status(500).json({ error: "Failed to delete column" });
    }
};