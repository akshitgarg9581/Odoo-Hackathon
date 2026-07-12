const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createFuelLog = async (req, res) => {
  try {
    const { vehicleId, fillDate, quantity, totalCost, odometerReading } = req.body;

    if (!vehicleId || !fillDate || quantity === undefined || totalCost === undefined || odometerReading === undefined) {
      return res.status(400).json({ error: "Missing required fuel log fields" });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(400).json({ error: "Vehicle not found" });
    }

    const numericQuantity = parseFloat(quantity);
    const numericCost = parseFloat(totalCost);
    const numericOdometer = parseFloat(odometerReading);

    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number" });
    }
    if (isNaN(numericCost) || numericCost <= 0) {
      return res.status(400).json({ error: "Total cost must be a positive number" });
    }
    if (isNaN(numericOdometer) || numericOdometer < 0) {
      return res.status(400).json({ error: "Odometer reading must be a non-negative number" });
    }

    const fuelLog = await prisma.fuelLog.create({
      data: {
        vehicleId,
        fillDate: new Date(fillDate),
        quantity: numericQuantity,
        totalCost: numericCost,
        odometerReading: numericOdometer
      }
    });

    res.status(201).json(fuelLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getFuelLogs = async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const filter = vehicleId ? { where: { vehicleId } } : {};

    const logs = await prisma.fuelLog.findMany({
      ...filter,
      include: { vehicle: true },
      orderBy: { fillDate: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateFuelLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { fillDate, quantity, totalCost, odometerReading } = req.body;

    const data = {};
    if (fillDate) data.fillDate = new Date(fillDate);
    if (quantity !== undefined) {
      const q = parseFloat(quantity);
      if (isNaN(q) || q <= 0) return res.status(400).json({ error: "Quantity must be a positive number" });
      data.quantity = q;
    }
    if (totalCost !== undefined) {
      const c = parseFloat(totalCost);
      if (isNaN(c) || c <= 0) return res.status(400).json({ error: "Total cost must be a positive number" });
      data.totalCost = c;
    }
    if (odometerReading !== undefined) {
      const o = parseFloat(odometerReading);
      if (isNaN(o) || o < 0) return res.status(400).json({ error: "Odometer reading must be a non-negative number" });
      data.odometerReading = o;
    }

    const fuelLog = await prisma.fuelLog.update({
      where: { id },
      data
    });

    res.json(fuelLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createFuelLog, getFuelLogs, updateFuelLog };
