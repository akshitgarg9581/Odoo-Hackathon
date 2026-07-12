import api from './client';
import type { Vehicle } from './vehicles';
import type { Driver } from './drivers';

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance: number | null;
  fuelConsumed: number | null;
  revenue: number | null;
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  dispatchTime: string | null;
  completeTime: string | null;
  cancelTime: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
  driver?: Driver;
}

export interface CreateTripData {
  vehicleId: string;
  driverId: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
}

export interface CompleteTripData {
  actualDistance: number;
  fuelConsumed: number;
  revenue?: number;
}

export const getTrips = (status?: string) =>
  api.get<Trip[]>('/trips', { params: status ? { status } : {} });
export const getTrip = (id: string) => api.get<Trip>(`/trips/${id}`);
export const createTrip = (data: CreateTripData) => api.post<Trip>('/trips', data);
export const dispatchTrip = (id: string) => api.patch<Trip>(`/trips/${id}/dispatch`);
export const completeTrip = (id: string, data: CompleteTripData) =>
  api.patch<Trip>(`/trips/${id}/complete`, data);
export const cancelTrip = (id: string) => api.patch<Trip>(`/trips/${id}/cancel`);
export const deleteTrip = (id: string) => api.delete(`/trips/${id}`);
