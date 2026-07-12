import api from './client';
import type { Vehicle } from './vehicles';

export interface FuelLog {
  id: string;
  vehicleId: string;
  fillDate: string;
  quantity: number;
  totalCost: number;
  odometerReading: number;
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
}

export interface CreateFuelData {
  vehicleId: string;
  fillDate: string;
  quantity: number;
  totalCost: number;
  odometerReading: number;
}

export const getFuelLogs = (vehicleId?: string) =>
  api.get<FuelLog[]>('/fuel', { params: vehicleId ? { vehicleId } : {} });
export const createFuelLog = (data: CreateFuelData) =>
  api.post<FuelLog>('/fuel', data);
