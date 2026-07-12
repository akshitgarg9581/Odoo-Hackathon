const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createVehicle = async (req, res) => {
    try {
        const { registrationNo, nameModel, type, maxLoadCapacity, odometer, acquisitionCost, status } = req.body;
        
        if (!registrationNo) return res.status(400).json({ error: "Registration number is required" });
        if (!nameModel) return res.status(400).json({ error: "Vehicle model name is required" });
        if (!type) return res.status(400).json({ error: "Vehicle type is required" });
        if (maxLoadCapacity === undefined) return res.status(400).json({ error: "Max load capacity is required" });
        
        const numericCapacity = parseFloat(maxLoadCapacity);
        if (isNaN(numericCapacity) || numericCapacity <= 0) {
            return res.status(400).json({ error: "Max load capacity must be a positive number" });
        }

        if (odometer !== undefined) {
            const numericOdometer = parseFloat(odometer);
            if (isNaN(numericOdometer) || numericOdometer < 0) {
                return res.status(400).json({ error: "Odometer must be a non-negative number" });
            }
        }

        if (acquisitionCost !== undefined) {
            const numericCost = parseFloat(acquisitionCost);
            if (isNaN(numericCost) || numericCost < 0) {
                return res.status(400).json({ error: "Acquisition cost must be a non-negative number" });
            }
        }

        const existing = await prisma.vehicle.findUnique({ where: { registrationNo } });
        if (existing) {
            return res.status(400).json({ error: "A vehicle with this registration number already exists." });
        }

        const vehicle = await prisma.vehicle.create({
            data: { 
                registrationNo, 
                nameModel, 
                type, 
                maxLoadCapacity: numericCapacity, 
                odometer: odometer !== undefined ? parseFloat(odometer) : 0, 
                acquisitionCost: acquisitionCost !== undefined ? parseFloat(acquisitionCost) : 0, 
                status: status || 'AVAILABLE' 
            }
        });
        res.status(201).json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getVehicles = async (req, res) => {
    try {
        const vehicles = await prisma.vehicle.findMany();
        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getVehicleById = async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
        if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateVehicle = async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteVehicle = async (req, res) => {
    try {
        await prisma.vehicle.delete({ where: { id: req.params.id } });
        res.json({ message: "Vehicle deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle };
