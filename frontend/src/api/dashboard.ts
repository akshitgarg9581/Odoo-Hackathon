import api from './client';

export interface KPIs {
  vehicles: {
    available: number;
    inShop: number;
    onTrip: number;
    totalActiveFleet: number;
  };
  trips: {
    pending: number;
    active: number;
  };
  drivers: {
    onDuty: number;
  };
  fleetUtilization: number;
}

export interface VehicleReport {
  vehicleId: string;
  registrationNo: string;
  nameModel: string;
  fuelEfficiency: number | null;
  operationalCost: number;
  roi: number | null;
}

export const getKPIs = () => api.get<KPIs>('/dashboard/kpis');
export const getReports = () => api.get<VehicleReport[]>('/dashboard/reports');
export const exportCSV = () =>
  api.get('/dashboard/reports/csv', { responseType: 'blob' });
