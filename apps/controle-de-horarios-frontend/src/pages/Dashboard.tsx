import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Title and Description */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Visão geral e estatísticas do sistema.</p>
        </div>
        {/* Action Buttons (if any) */}
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Gerar Relatório
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Total Viagens */}
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Total de Viagens</h2>
          <p className="mt-2 text-3xl font-bold text-blue-600">1,234</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Últimos 30 dias</p>
        </div>

        {/* Card 2: Viagens Cumpridas */}
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Viagens Cumpridas</h2>
          <p className="mt-2 text-3xl font-bold text-green-600">987</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">80% de cumprimento</p>
        </div>

        {/* Card 3: Viagens Não Cumpridas */}
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Viagens Não Cumpridas</h2>
          <p className="mt-2 text-3xl font-bold text-red-600">247</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">20% de não cumprimento</p>
        </div>

        {/* Example Section: Recent Activities Table */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Atividades Recentes</h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Viagem ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#12345</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500">Cumprida</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">2023-10-27</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#12346</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">Não Cumprida</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">2023-10-27</td>
              </tr>
              {/* More rows... */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
