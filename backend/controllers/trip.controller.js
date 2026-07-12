const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createTrip = async (req, res) => {
  try {
    const { vehicleId, driverId, source, destination, cargoWeight, plannedDistance } = req.body;

    if (!vehicleId || !driverId || !source || !destination || cargoWeight === undefined || plannedDistance === undefined) {
      return res.status(400).json({ error: "Missing required trip fields" });
    }

    // Wrap validation and creation in a transaction to prevent double-booking
    const trip = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
      const driver = await tx.driver.findUnique({ where: { id: driverId } });

      if (!vehicle) throw new Error("Vehicle not found");
      if (vehicle.status !== 'AVAILABLE') throw new Error("Vehicle is not available for assignment");
      if (cargoWeight > vehicle.maxLoadCapacity) throw new Error(`Cargo weight exceeds vehicle capacity (${vehicle.maxLoadCapacity})`);
      
      if (!driver) throw new Error("Driver not found");
      if (driver.status !== 'AVAILABLE') throw new Error("Driver is not available for assignment");
      if (new Date(driver.licenseExpiryDate) < new Date()) throw new Error("Driver's license is expired");

      return await tx.trip.create({
        data: {
          vehicleId,
          driverId,
          source,
          destination,
          cargoWeight: parseFloat(cargoWeight),
          plannedDistance: parseFloat(plannedDistance),
          status: 'DRAFT'
        }
      });
    });

    res.status(201).json(trip);
  } catch (error) {
    if (error.message && error.message !== "Internal server error" && !error.message.includes("Prisma")) {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const dispatchTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.$transaction(async (tx) => {
      const existingTrip = await tx.trip.findUnique({ where: { id } });
      if (!existingTrip) throw new Error("Trip not found");
      if (existingTrip.status !== 'DRAFT') throw new Error("Only DRAFT trips can be dispatched");

      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: 'DISPATCHED',
          dispatchTime: new Date()
        }
      });

      await tx.vehicle.update({
        where: { id: existingTrip.vehicleId },
        data: { status: 'ON_TRIP' }
      });

      await tx.driver.update({
        where: { id: existingTrip.driverId },
        data: { status: 'ON_TRIP' }
      });

      return updatedTrip;
    });

    res.json(trip);
  } catch (error) {
    if (error.message && !error.message.includes("Prisma")) {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const completeTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualDistance, fuelConsumed, revenue } = req.body;

    if (actualDistance === undefined || fuelConsumed === undefined) {
      return res.status(400).json({ error: "actualDistance and fuelConsumed are required to complete a trip" });
    }

    const trip = await prisma.$transaction(async (tx) => {
      const existingTrip = await tx.trip.findUnique({ where: { id } });
      if (!existingTrip) throw new Error("Trip not found");
      if (existingTrip.status !== 'DISPATCHED') throw new Error("Only DISPATCHED trips can be completed");

      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completeTime: new Date(),
          actualDistance: parseFloat(actualDistance),
          fuelConsumed: parseFloat(fuelConsumed),
          revenue: revenue !== undefined ? parseFloat(revenue) : null
        }
      });

      // Safely increment the odometer using Prisma math
      await tx.vehicle.update({
        where: { id: existingTrip.vehicleId },
        data: { 
          status: 'AVAILABLE',
          odometer: { increment: parseFloat(actualDistance) }
        }
      });

      await tx.driver.update({
        where: { id: existingTrip.driverId },
        data: { status: 'AVAILABLE' }
      });

      return updatedTrip;
    });

    res.json(trip);
  } catch (error) {
    if (error.message && !error.message.includes("Prisma")) {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const cancelTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.$transaction(async (tx) => {
      const existingTrip = await tx.trip.findUnique({ where: { id } });
      if (!existingTrip) throw new Error("Trip not found");
      if (existingTrip.status !== 'DISPATCHED') throw new Error("Only DISPATCHED trips can be cancelled");

      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelTime: new Date()
        }
      });

      await tx.vehicle.update({
        where: { id: existingTrip.vehicleId },
        data: { status: 'AVAILABLE' }
      });

      await tx.driver.update({
        where: { id: existingTrip.driverId },
        data: { status: 'AVAILABLE' }
      });

      return updatedTrip;
    });

    res.json(trip);
  } catch (error) {
    if (error.message && !error.message.includes("Prisma")) {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingTrip = await prisma.trip.findUnique({ where: { id } });
    if (!existingTrip) return res.status(404).json({ error: "Trip not found" });
    if (existingTrip.status !== 'DRAFT') return res.status(400).json({ error: "Only DRAFT trips can be deleted" });

    await prisma.trip.delete({ where: { id } });
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTrips = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { where: { status } } : {};
    
    const trips = await prisma.trip.findMany({
      ...filter,
      include: {
        vehicle: true,
        driver: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTripById = async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        driver: true
      }
    });
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip, getTrips, getTripById };
