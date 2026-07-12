import api from './client';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export const getDrivers = () => api.get<Driver[]>('/drivers');
export const getDriver = (id: string) => api.get<Driver>(`/drivers/${id}`);
export const createDriver = (data: Partial<Driver>) => api.post<Driver>('/drivers', data);
export const updateDriver = (id: string, data: Partial<Driver>) => api.put<Driver>(`/drivers/${id}`, data);
export const deleteDriver = (id: string) => api.delete(`/drivers/${id}`);
