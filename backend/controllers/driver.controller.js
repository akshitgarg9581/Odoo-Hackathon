const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createDriver = async (req, res) => {
  try {
    const {
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    if (!licenseNumber)
      return res.status(400).json({ error: "License number is required" });

    if (!licenseCategory)
      return res.status(400).json({ error: "License category is required" });

    if (!licenseExpiryDate)
      return res.status(400).json({ error: "License expiry date is required" });

    const expiryDate = new Date(licenseExpiryDate);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({ error: "Please enter a valid license expiry date" });
    }

    const existing = await prisma.driver.findUnique({
      where: { licenseNumber },
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "A driver with this license number already exists." });
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

module.exports = { createDriver, getDrivers };
