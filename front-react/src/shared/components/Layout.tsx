import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Landmark, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { isTokenValid, useAuthStore } from '@/shared/store/authStore';

const navItems = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/eventos', label: 'Eventos', end: true },
  { to: '/eventos/mis-filtros', label: 'Mis filtros', end: true },
  { to: '/obras', label: 'Catálogo', end: false },
];

export function Layout() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const isLogged = isTokenValid(token);

  const user = useAuthStore((state) => state.user);
  const canSeeReport = user?.role === 'CURADOR' || user?.role === 'ADMINISTRADOR';
  const isVisitor = user?.role === 'VISITANTE';
  const roleNavItems = isVisitor
    ? [...navItems, { to: '/recorrido', label: 'Armar recorrido', end: true }]
    : navItems;
  const finalNavItems = canSeeReport
    ? [{ to: '/eventos/reporte', label: 'Reporte', end: false }, ...roleNavItems]
    : roleNavItems;

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

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

          {finalNavItems.map((item) => (
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

          {isLogged ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              Cerrar sesión
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>
              <LogIn className="size-4" />
              Iniciar sesión
            </Button>
          )}
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