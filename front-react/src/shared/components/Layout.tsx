import { Link, NavLink, Outlet } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { cn } from 'cn';

const navItems = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/eventos', label: 'Eventos', end: true },
  { to: '/eventos/mis-filtros', label: 'Mis filtros', end: true },
  { to: '/catalogo', label: 'Catálogo', end: false },
];

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
        <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-7 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" className="mr-auto flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Landmark className="size-5" />
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Museo Virtual
            </span>
          </Link>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                  isActive && 'text-foreground underline decoration-primary decoration-2 underline-offset-[6px]',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* TODO(auth): reemplazar por el menú de sesión (login / perfil según rol). */}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          Museo Virtual Interactivo · Trabajo práctico de Sistemas Distribuidos
        </div>
      </footer>
    </div>
  );
}
