const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createMaintenance = async (req, res) => {
  try {
    const { vehicleId, serviceType, cost, serviceDate, description } = req.body;

    if (!vehicleId || !serviceType || cost === undefined || !serviceDate || !description) {
      return res.status(400).json({ error: "Missing required maintenance log fields" });
    }

    const log = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) throw new Error("Vehicle not found");
      if (vehicle.status === 'IN_SHOP') throw new Error("Vehicle is already undergoing maintenance");
      if (vehicle.status === 'RETIRED') throw new Error("Cannot maintain a retired vehicle");

      const newLog = await tx.maintenanceLog.create({
        data: {
          vehicleId,
          serviceType,
          cost: parseFloat(cost),
          serviceDate: new Date(serviceDate),
          description,
          status: 'IN_PROGRESS'
        }
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'IN_SHOP' }
      });

      return newLog;
    });

    res.status(201).json(log);
  } catch (error) {
    if (error.message && !error.message.includes("Prisma")) {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const completeMaintenance = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.$transaction(async (tx) => {
      const existingLog = await tx.maintenanceLog.findUnique({ where: { id } });
      if (!existingLog) throw new Error("Maintenance log not found");
      
      // Transition check: Only IN_PROGRESS maintenance logs can be completed
      if (existingLog.status !== 'IN_PROGRESS') {
        throw new Error("Only IN_PROGRESS maintenance logs can be completed");
      }

      const updatedLog = await tx.maintenanceLog.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });

      await tx.vehicle.update({
        where: { id: existingLog.vehicleId },
        data: { status: 'AVAILABLE' }
      });

      return updatedLog;
    });

    res.json(log);
  } catch (error) {
    if (error.message && !error.message.includes("Prisma")) {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getMaintenanceLogs = async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const filter = vehicleId ? { where: { vehicleId } } : {};

    const logs = await prisma.maintenanceLog.findMany({
      ...filter,
      include: { vehicle: true },
      orderBy: { serviceDate: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceType, cost, serviceDate, description } = req.body;

    const data = {};
    if (serviceType) data.serviceType = serviceType;
    if (cost !== undefined) {
      const c = parseFloat(cost);
      if (isNaN(c) || c < 0) return res.status(400).json({ error: "Cost must be a positive number" });
      data.cost = c;
    }
    if (serviceDate) data.serviceDate = new Date(serviceDate);
    if (description !== undefined) data.description = description;

    const log = await prisma.maintenanceLog.update({
      where: { id },
      data
    });

    res.json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createMaintenance, completeMaintenance, getMaintenanceLogs, updateMaintenance };
