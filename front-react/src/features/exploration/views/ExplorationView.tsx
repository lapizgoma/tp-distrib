import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useExploration } from '../hooks/useExploration';
import { Compass, Palette, User, Calendar } from 'lucide-react';
import type { Work, Artist, Event } from '../types/exploration.types';

const ERAS_DISPONIBLES = [
  'IMPRESIONISMO',
  'RENACIMIENTO',
  'BARROCO',
  'EXPRESIONISMO',
  'SURREALISMO',
  'ARTE CONTEMPORANEO',
];

export const ExplorationView: React.FC = () => {
  const [selectedEra, setSelectedEra] = useState<string>('IMPRESIONISMO');
  const { data, loading, error, fetchExploration } = useExploration();

  useEffect(() => {
    fetchExploration(selectedEra);
  }, [selectedEra, fetchExploration]);

  // Extraemos artistas únicos usando los tipos definidos
  const extractedArtists = React.useMemo<Artist[]>(() => {
    if (!data) return [];
    if (data.artists && data.artists.length > 0) return data.artists;

    const uniqueNames = new Set<string>();
    data.works?.forEach((w: Work) => {
      const name = w.artist_name;
      if (name) uniqueNames.add(name);
    });

    return Array.from(uniqueNames).map((name, idx) => ({
      id: idx + 1,
      name,
    }));
  }, [data]);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner Principal */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/20">
            <Compass className="h-3.5 w-3.5" />
            Exploración Contextual
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Exploración por Era
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Navegá y relacioná información contextual perteneciente a distintos dominios del museo: obras, artistas asociados y actividades del movimiento.
          </p>
        </div>
      </div>

      {/* Control de Selección de Era */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <label htmlFor="era-select" className="text-sm font-semibold text-slate-700">
            Seleccionar Movimiento Artístico:
          </label>
          <select
            id="era-select"
            value={selectedEra}
            onChange={(e) => setSelectedEra(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ERAS_DISPONIBLES.map((era) => (
              <option key={era} value={era}>
                {era}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estado de Carga / Error */}
      {loading && (
        <div className="p-12 text-center text-slate-500">
          Cargando información unificada...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Secciones de Contenido */}
      {data && !loading && (
        <div className="space-y-8">
          {/* Sección 1: Obras */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Palette className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Obras ({data.works?.length || 0})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.works?.length > 0 ? (
                data.works.map((work: Work) => (
                  <Link
                    key={work.id}
                    to={`/obras/${work.id}`}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md cursor-pointer"
                  >
                    <div className="space-y-2">
                      <span className="inline-block rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {work.technique || 'ÓLEO'}
                      </span>
                      <h3 className="font-bold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                        {work.title}
                      </h3>
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Artista:</span>{' '}
                        {work.artist_name || 'Desconocido'}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="col-span-full text-sm text-slate-500">
                  No se encontraron obras para esta era.
                </p>
              )}
            </div>
          </section>

          {/* Sección 2: Artistas */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <User className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Artistas Asociados ({extractedArtists.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {extractedArtists.length > 0 ? (
                extractedArtists.map((artist: Artist) => (
                  <div
                    key={artist.id || artist.name}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                      {artist.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{artist.name}</h3>
                      <p className="text-xs text-slate-500">Movimiento: {selectedEra}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-sm text-slate-500">
                  No se encontraron artistas asociados a esta era.
                </p>
              )}
            </div>
          </section>

          {/* Sección 3: Eventos */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Calendar className="h-5 w-5 text-amber-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Eventos y Actividades Vinculadas ({data.events?.length || 0})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.events?.length > 0 ? (
                data.events.map((event: Event) => (
                  <Link
                    key={event.id}
                    to={`/eventos/${event.id}`}
                    className="space-y-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md cursor-pointer block"
                  >
                    <span className="inline-block rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      {event.type || 'EXPOSICIÓN'}
                    </span>
                    <h3 className="font-bold text-slate-900 hover:text-amber-600 transition-colors">{event.title}</h3>
                    {event.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </Link>
                ))
              ) : (
                <p className="col-span-full text-sm text-slate-500">
                  No hay eventos o actividades registradas para esta era.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};