import React, { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import type { NewsType } from '../types/audit.types';

export function AuditLogsView() {
  const { logs, hasMore, loading, error, filters, setFilters } = useAuditLogs({ page: 0, size: 20 });
  const [selectedChanges, setSelectedChanges] = useState<unknown | null>(null);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      page: 0,
      [name]: value,
    }));
  };

  const badgeColor = (newsType: NewsType) => {
    switch (newsType) {
      case 'EVENT_CREATED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'EVENT_UPDATED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EVENT_CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Auditoría (Kafka)</h1>
          <p className="text-sm text-gray-600">Registro asíncrono de operaciones sobre eventos del museo.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Novedad</label>
          <select
            name="newsType"
            value={filters.newsType || ''}
            onChange={handleFilterChange}
            className="w-full border rounded p-2 text-sm"
          >
            <option value="">Todas</option>
            <option value="EVENT_CREATED">Alta de Evento</option>
            <option value="EVENT_UPDATED">Modificación de Evento</option>
            <option value="EVENT_CANCELLED">Cancelación de Evento</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">ID Evento</label>
          <input
            type="number"
            name="eventId"
            placeholder="Ej: 12"
            value={filters.eventId || ''}
            onChange={handleFilterChange}
            className="w-full border rounded p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">ID Usuario Responsable</label>
          <input
            type="number"
            name="responsibleUserId"
            placeholder="Ej: 5"
            value={filters.responsibleUserId || ''}
            onChange={handleFilterChange}
            className="w-full border rounded p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Ocurrencia Desde</label>
          <input
            type="date"
            name="from"
            value={filters.from || ''}
            onChange={handleFilterChange}
            className="w-full border rounded p-2 text-sm"
          />
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-100 border-b text-xs uppercase font-semibold text-gray-600">
            <tr>
              <th className="py-3 px-4">Fecha y Hora</th>
              <th className="py-3 px-4">Operación</th>
              <th className="py-3 px-4">ID / Título Evento</th>
              <th className="py-3 px-4">Usuario Resp.</th>
              <th className="py-3 px-4">Offset Kafka</th>
              <th className="py-3 px-4 text-right">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  Cargando registros de auditoría...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  No se encontraron eventos de auditoría.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">
                    {new Date(log.occurredAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs border rounded-full font-medium ${badgeColor(log.newsType)}`}>
                      {log.newsType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">#{log.eventId}</span> - {log.eventTitle}
                  </td>
                  <td className="py-3 px-4">
                    {log.responsibleUserId ? `Usuario #${log.responsibleUserId}` : 'Sistema / -'}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {log.kafka.topic}[{log.kafka.partition}]@{log.kafka.offset}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {log.changes && typeof log.changes === 'object' && Object.keys(log.changes).length > 0 ? (
                      <button
                        onClick={() => setSelectedChanges(log.changes)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200"
                      >
                        Ver Cambios
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          disabled={(filters.page || 0) === 0 || loading}
          onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(0, (prev.page || 0) - 1) }))}
          className="px-4 py-2 border rounded text-sm disabled:opacity-50 hover:bg-gray-100"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-600">Página {(filters.page || 0) + 1}</span>
        <button
          disabled={!hasMore || loading}
          onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 0) + 1 }))}
          className="px-4 py-2 border rounded text-sm disabled:opacity-50 hover:bg-gray-100"
        >
          Siguiente
        </button>
      </div>

      {selectedChanges !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Detalle de Modificaciones</h3>
            <div className="max-h-80 overflow-y-auto space-y-2 text-xs font-mono">
              <pre className="bg-gray-900 text-green-400 p-3 rounded">
                {JSON.stringify(selectedChanges, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedChanges(null)}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}