import { useState, useEffect } from 'react';
import api from '../api/client';

interface KPIs {
  activeFleet: number;
  maintenanceAlerts: number;
  utilizationRate: number;
  pendingCargo: number;
}

interface Vehicle {
  id: number;
  name: string;
  license_plate: string;
  vehicle_type: string;
  max_capacity_kg: number;
  odometer: number;
  status: string;
  region: string;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    vehicleType: '',
    status: '',
    region: '',
  });

  useEffect(() => {
    fetchKPIs();
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const fetchKPIs = async () => {
    try {
      const response = await api.get('/dashboard/kpis');
      setKpis(response.data);
    } catch (error) {
      console.error('Failed to fetch KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const params: any = {};
      if (filters.vehicleType) params.type = filters.vehicleType;
      if (filters.status) params.status = filters.status;
      if (filters.region) params.region = filters.region;
      
      const response = await api.get('/vehicles', { params });
      setVehicles(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
        <p className="mt-1 text-sm text-gray-500">
          High-level fleet oversight and monitoring
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">🚛</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Fleet
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {kpis?.activeFleet || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">🔧</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Maintenance Alerts
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {kpis?.maintenanceAlerts || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📊</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Utilization Rate
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {kpis?.utilizationRate || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📦</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Cargo
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {kpis?.pendingCargo || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Fleet Filters</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vehicle Type
            </label>
            <select
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={filters.vehicleType}
              onChange={(e) =>
                setFilters({ ...filters, vehicleType: e.target.value })
              }
            >
              <option value="">All Types</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Bike">Bike</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Out of Service">Out of Service</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Region
            </label>
            <input
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter region"
              value={filters.region}
              onChange={(e) =>
                setFilters({ ...filters, region: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Filtered Vehicle List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Fleet Overview {vehicles.length > 0 && `(${vehicles.length} vehicles)`}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Odometer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vehicle.name}</div>
                    <div className="text-sm text-gray-500">{vehicle.license_plate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vehicle.vehicle_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vehicle.max_capacity_kg} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vehicle.odometer.toLocaleString()} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vehicle.status === 'Available'
                          ? 'bg-green-100 text-green-800'
                          : vehicle.status === 'On Trip'
                          ? 'bg-blue-100 text-blue-800'
                          : vehicle.status === 'In Shop'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vehicle.region || 'N/A'}
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No vehicles found matching the filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

