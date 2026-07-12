const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createDriver = async (req, res) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!licenseNumber) return res.status(400).json({ error: "License number is required" });
    if (!licenseCategory) return res.status(400).json({ error: "License category is required" });
    if (!licenseExpiryDate) return res.status(400).json({ error: "License expiry date is required" });

    const expiryDate = new Date(licenseExpiryDate);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({ error: "Please enter a valid license expiry date" });
    }

    const existing = await prisma.driver.findUnique({
      where: { licenseNumber },
    });
    if (existing) {
      return res.status(400).json({ error: "A driver with this license number already exists." });
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        licenseNumber,
        licenseCategory,
        contactNumber: contactNumber || "",
        licenseExpiryDate: expiryDate,
      },
    });
    res.status(201).json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany();
    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getDriverById = async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { name, licenseCategory, licenseExpiryDate, contactNumber, status } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (licenseCategory) updateData.licenseCategory = licenseCategory;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    
    if (status) {
        const VALID_STATUSES = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: "Invalid status enum value." });
        }
        updateData.status = status;
    }
    
    if (licenseExpiryDate) {
        const expiryDate = new Date(licenseExpiryDate);
        if (isNaN(expiryDate.getTime())) {
          return res.status(400).json({ error: "Please enter a valid license expiry date" });
        }
        updateData.licenseExpiryDate = expiryDate;
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
    }

    const driver = await prisma.driver.update({
        where: { id: req.params.id },
        data: updateData
    });
    res.json(driver);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
        return res.status(404).json({ error: "Driver not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteDriver = async (req, res) => {
  try {
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
        return res.status(404).json({ error: "Driver not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createDriver, getDrivers, getDriverById, updateDriver, deleteDriver };
