import api from './client';
import type { Vehicle } from './vehicles';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  cost: number;
  serviceDate: string;
  description: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
}

export interface CreateMaintenanceData {
  vehicleId: string;
  serviceType: string;
  cost: number;
  serviceDate: string;
  description: string;
}

export const getMaintenanceLogs = (vehicleId?: string) =>
  api.get<MaintenanceLog[]>('/maintenance', { params: vehicleId ? { vehicleId } : {} });
export const createMaintenanceLog = (data: CreateMaintenanceData) =>
  api.post<MaintenanceLog>('/maintenance', data);
export const completeMaintenance = (id: string) =>
  api.patch<MaintenanceLog>(`/maintenance/${id}/complete`);
