const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Seeding fake data...');

  // 1. Clear existing data
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create users
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.createMany({
    data: [
      { name: 'Admin Manager', email: 'admin@transitops.com', passwordHash, role: 'FLEET_MANAGER' },
      { name: 'Finance Lead', email: 'finance@transitops.com', passwordHash, role: 'FINANCIAL_ANALYST' },
      { name: 'Safety Officer', email: 'safety@transitops.com', passwordHash, role: 'SAFETY_OFFICER' },
    ]
  });

  // 3. Create Vehicles
  const vehicleData = [
    { registrationNo: 'MH-12-AB-1234', nameModel: 'Tata Ace Gold', type: 'Light Truck', maxLoadCapacity: 750, odometer: 15000, acquisitionCost: 550000, status: 'AVAILABLE' },
    { registrationNo: 'KA-01-XY-9876', nameModel: 'Ashok Leyland Dost', type: 'Light Truck', maxLoadCapacity: 1250, odometer: 32000, acquisitionCost: 750000, status: 'AVAILABLE' },
    { registrationNo: 'MH-43-MN-4567', nameModel: 'Mahindra Bolero Pik-Up', type: 'Pickup', maxLoadCapacity: 1500, odometer: 45000, acquisitionCost: 850000, status: 'ON_TRIP' },
    { registrationNo: 'DL-01-CD-3456', nameModel: 'Tata 407', type: 'Medium Truck', maxLoadCapacity: 2500, odometer: 120000, acquisitionCost: 1200000, status: 'IN_SHOP' },
    { registrationNo: 'TN-22-PQ-8765', nameModel: 'Eicher Pro 2049', type: 'Medium Truck', maxLoadCapacity: 4900, odometer: 65000, acquisitionCost: 1500000, status: 'AVAILABLE' },
    { registrationNo: 'GJ-05-KL-2345', nameModel: 'BharatBenz 1215R', type: 'Heavy Truck', maxLoadCapacity: 12000, odometer: 210000, acquisitionCost: 2800000, status: 'ON_TRIP' },
    { registrationNo: 'WB-02-RS-6789', nameModel: 'Tata Signa 2825', type: 'Heavy Truck', maxLoadCapacity: 28000, odometer: 85000, acquisitionCost: 3500000, status: 'AVAILABLE' },
    { registrationNo: 'UP-32-UV-5432', nameModel: 'Mahindra Furio 14', type: 'Medium Truck', maxLoadCapacity: 14000, odometer: 95000, acquisitionCost: 1900000, status: 'AVAILABLE' },
    { registrationNo: 'KL-07-WX-1357', nameModel: 'Ashok Leyland Ecomet', type: 'Medium Truck', maxLoadCapacity: 16000, odometer: 130000, acquisitionCost: 2100000, status: 'AVAILABLE' },
    { registrationNo: 'HR-26-YZ-2468', nameModel: 'Maruti Suzuki Super Carry', type: 'Mini Truck', maxLoadCapacity: 740, odometer: 12000, acquisitionCost: 450000, status: 'RETIRED' },
  ];
  
  await prisma.vehicle.createMany({ data: vehicleData });
  const vehicles = await prisma.vehicle.findMany();

  // 4. Create Drivers
  const driverData = [
    { name: 'Rajesh Kumar', licenseNumber: 'DL-1420110012345', licenseCategory: 'HMV', licenseExpiryDate: new Date('2028-05-15'), contactNumber: '+91 9876543210', safetyScore: 92, status: 'AVAILABLE' },
    { name: 'Suresh Singh', licenseNumber: 'MH-1220150098765', licenseCategory: 'LMV', licenseExpiryDate: new Date('2027-11-20'), contactNumber: '+91 8765432109', safetyScore: 85, status: 'AVAILABLE' },
    { name: 'Amit Patel', licenseNumber: 'GJ-0520180045678', licenseCategory: 'HMV', licenseExpiryDate: new Date('2029-02-10'), contactNumber: '+91 7654321098', safetyScore: 98, status: 'ON_TRIP' },
    { name: 'Vikram Sharma', licenseNumber: 'KA-0120190034567', licenseCategory: 'HMV', licenseExpiryDate: new Date('2026-08-25'), contactNumber: '+91 6543210987', safetyScore: 74, status: 'AVAILABLE' },
    { name: 'Manoj Tiwari', licenseNumber: 'UP-3220160087654', licenseCategory: 'LMV', licenseExpiryDate: new Date('2025-12-05'), contactNumber: '+91 9988776655', safetyScore: 88, status: 'OFF_DUTY' },
    { name: 'Ravi Teja', licenseNumber: 'TN-2220170023456', licenseCategory: 'HMV', licenseExpiryDate: new Date('2028-09-30'), contactNumber: '+91 8877665544', safetyScore: 95, status: 'ON_TRIP' },
    { name: 'Anil Das', licenseNumber: 'WB-0220200067890', licenseCategory: 'HMV', licenseExpiryDate: new Date('2030-01-15'), contactNumber: '+91 7766554433', safetyScore: 81, status: 'AVAILABLE' },
    { name: 'Sanjay Dutt', licenseNumber: 'HR-2620140054321', licenseCategory: 'LMV', licenseExpiryDate: new Date('2025-06-20'), contactNumber: '+91 6655443322', safetyScore: 65, status: 'SUSPENDED' },
    { name: 'Prakash Raj', licenseNumber: 'KL-0720130013579', licenseCategory: 'HMV', licenseExpiryDate: new Date('2027-04-12'), contactNumber: '+91 5544332211', safetyScore: 89, status: 'AVAILABLE' },
    { name: 'Sunil Shetty', licenseNumber: 'MP-0920210024680', licenseCategory: 'LMV', licenseExpiryDate: new Date('2031-10-08'), contactNumber: '+91 9012345678', safetyScore: 91, status: 'AVAILABLE' },
  ];

  await prisma.driver.createMany({ data: driverData });
  const drivers = await prisma.driver.findMany();

  // 5. Create Trips
  const tripsData = [
    { vehicleId: vehicles[2].id, driverId: drivers[2].id, source: 'Mumbai', destination: 'Pune', cargoWeight: 1200, plannedDistance: 150, status: 'DISPATCHED', dispatchTime: new Date(Date.now() - 3600000) },
    { vehicleId: vehicles[5].id, driverId: drivers[5].id, source: 'Ahmedabad', destination: 'Surat', cargoWeight: 11000, plannedDistance: 260, status: 'DISPATCHED', dispatchTime: new Date(Date.now() - 7200000) },
    
    { vehicleId: vehicles[0].id, driverId: drivers[0].id, source: 'Delhi', destination: 'Gurgaon', cargoWeight: 500, plannedDistance: 45, status: 'COMPLETED', actualDistance: 48, fuelConsumed: 4.5, revenue: 3500, dispatchTime: new Date(Date.now() - 86400000), completeTime: new Date(Date.now() - 82800000) },
    { vehicleId: vehicles[1].id, driverId: drivers[1].id, source: 'Bangalore', destination: 'Mysore', cargoWeight: 1000, plannedDistance: 145, status: 'COMPLETED', actualDistance: 150, fuelConsumed: 12, revenue: 8500, dispatchTime: new Date(Date.now() - 172800000), completeTime: new Date(Date.now() - 160000000) },
    { vehicleId: vehicles[6].id, driverId: drivers[6].id, source: 'Kolkata', destination: 'Haldia', cargoWeight: 25000, plannedDistance: 120, status: 'COMPLETED', actualDistance: 125, fuelConsumed: 30, revenue: 18000, dispatchTime: new Date(Date.now() - 259200000), completeTime: new Date(Date.now() - 240000000) },
    
    { vehicleId: vehicles[4].id, driverId: drivers[3].id, source: 'Chennai', destination: 'Vellore', cargoWeight: 4500, plannedDistance: 140, status: 'DRAFT' },
    { vehicleId: vehicles[8].id, driverId: drivers[8].id, source: 'Kochi', destination: 'Trivandrum', cargoWeight: 15000, plannedDistance: 200, status: 'DRAFT' },
    { vehicleId: vehicles[7].id, driverId: drivers[9].id, source: 'Lucknow', destination: 'Kanpur', cargoWeight: 12000, plannedDistance: 90, status: 'CANCELLED', cancelTime: new Date(Date.now() - 43200000) },
  ];

  await prisma.trip.createMany({ data: tripsData });

  // 6. Create Maintenance Logs
  const maintenanceData = [
    { vehicleId: vehicles[3].id, serviceType: 'Engine Repair', cost: 45000, serviceDate: new Date(), description: 'Engine overhaul and parts replacement', status: 'IN_PROGRESS' },
    { vehicleId: vehicles[0].id, serviceType: 'Oil Change', cost: 2500, serviceDate: new Date(Date.now() - 2592000000), description: 'Regular oil and filter change', status: 'COMPLETED' },
    { vehicleId: vehicles[1].id, serviceType: 'Tire Replacement', cost: 18000, serviceDate: new Date(Date.now() - 5184000000), description: 'Replaced all 4 tires', status: 'COMPLETED' },
    { vehicleId: vehicles[6].id, serviceType: 'Brake Service', cost: 8500, serviceDate: new Date(Date.now() - 1296000000), description: 'Brake pads replacement and bleeding', status: 'COMPLETED' },
  ];

  await prisma.maintenanceLog.createMany({ data: maintenanceData });

  // 7. Create Fuel Logs
  const fuelData = [
    { vehicleId: vehicles[0].id, fillDate: new Date(Date.now() - 86400000), quantity: 25, totalCost: 2250, odometerReading: 14950 },
    { vehicleId: vehicles[1].id, fillDate: new Date(Date.now() - 172800000), quantity: 35, totalCost: 3150, odometerReading: 31850 },
    { vehicleId: vehicles[2].id, fillDate: new Date(Date.now() - 43200000), quantity: 40, totalCost: 3600, odometerReading: 44950 },
    { vehicleId: vehicles[5].id, fillDate: new Date(Date.now() - 259200000), quantity: 120, totalCost: 10800, odometerReading: 209500 },
    { vehicleId: vehicles[6].id, fillDate: new Date(Date.now() - 518400000), quantity: 200, totalCost: 18000, odometerReading: 84500 },
  ];

  await prisma.fuelLog.createMany({ data: fuelData });

  console.log('Successfully seeded database with fake realistic data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
