import api from './client';

export interface Vehicle {
  id: string;
  registrationNo: string;
  nameModel: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
  createdAt: string;
  updatedAt: string;
}

export const getVehicles = () => api.get<Vehicle[]>('/vehicles');
export const getVehicle = (id: string) => api.get<Vehicle>(`/vehicles/${id}`);
export const createVehicle = (data: Partial<Vehicle>) => api.post<Vehicle>('/vehicles', data);
export const updateVehicle = (id: string, data: Partial<Vehicle>) => api.put<Vehicle>(`/vehicles/${id}`, data);
export const deleteVehicle = (id: string) => api.delete(`/vehicles/${id}`);
