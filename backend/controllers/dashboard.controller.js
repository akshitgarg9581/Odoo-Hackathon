const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getKPIs = async (req, res) => {
  try {
    const [
      availableVehicles,
      inShopVehicles,
      onTripVehicles,
      retiredVehicles,
      pendingTrips,
      activeTrips,
      driversOnDuty
    ] = await Promise.all([
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
      prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
      prisma.vehicle.count({ where: { status: 'RETIRED' } }),
      prisma.trip.count({ where: { status: 'DRAFT' } }),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.driver.count({ where: { status: 'ON_TRIP' } })
    ]);

    const totalActiveFleet = availableVehicles + inShopVehicles + onTripVehicles;
    const fleetUtilization = totalActiveFleet > 0 ? (onTripVehicles / totalActiveFleet) * 100 : 0;

    res.json({
      vehicles: {
        available: availableVehicles,
        inShop: inShopVehicles,
        onTrip: onTripVehicles,
        totalActiveFleet
      },
      trips: {
        pending: pendingTrips,
        active: activeTrips
      },
      drivers: {
        onDuty: driversOnDuty
      },
      fleetUtilization: parseFloat(fleetUtilization.toFixed(2))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getReports = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: {
          where: { status: 'COMPLETED' }
        },
        maintenanceLogs: true,
        fuelLogs: true
      }
    });

    const reports = vehicles.map(vehicle => {
      const totalDistance = vehicle.trips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
      const totalFuel = vehicle.fuelLogs.reduce((sum, log) => sum + log.quantity, 0);
      const fuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : null;

      const totalFuelCost = vehicle.fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
      const totalMaintenanceCost = vehicle.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
      const operationalCost = totalFuelCost + totalMaintenanceCost;

      const totalRevenue = vehicle.trips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);
      
      let roi = null;
      if (vehicle.acquisitionCost > 0 && vehicle.trips.length > 0) {
        roi = (totalRevenue - operationalCost) / vehicle.acquisitionCost;
      }

      return {
        vehicleId: vehicle.id,
        registrationNo: vehicle.registrationNo,
        nameModel: vehicle.nameModel,
        fuelEfficiency: fuelEfficiency !== null ? parseFloat(fuelEfficiency.toFixed(2)) : null,
        operationalCost: parseFloat(operationalCost.toFixed(2)),
        roi: roi !== null ? parseFloat(roi.toFixed(4)) : null
      };
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const exportReportsCSV = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: {
          where: { status: 'COMPLETED' }
        },
        maintenanceLogs: true,
        fuelLogs: true
      }
    });

    let csvContent = "Vehicle ID,Registration No,Model,Fuel Efficiency,Operational Cost,ROI\n";

    vehicles.forEach(vehicle => {
      const totalDistance = vehicle.trips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
      const totalFuel = vehicle.fuelLogs.reduce((sum, log) => sum + log.quantity, 0);
      const fuelEfficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(2) : "N/A";

      const totalFuelCost = vehicle.fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
      const totalMaintenanceCost = vehicle.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
      const operationalCost = (totalFuelCost + totalMaintenanceCost).toFixed(2);

      const totalRevenue = vehicle.trips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);
      let roi = "N/A";
      if (vehicle.acquisitionCost > 0 && vehicle.trips.length > 0) {
        roi = ((totalRevenue - operationalCost) / vehicle.acquisitionCost).toFixed(4);
      }

      csvContent += `"${vehicle.id}","${vehicle.registrationNo}","${vehicle.nameModel}",${fuelEfficiency},${operationalCost},${roi}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fleet_reports.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getKPIs, getReports, exportReportsCSV };
