import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import type { UserRole } from '@/features/auth/types/user-role.types';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isTokenValid, useAuthStore } from '@/shared/store/authStore';

interface RequireRoleProps {
  /** Roles permitidos. Si se omite, alcanza con tener sesión válida. */
  roles?: UserRole[];
}

/**
 * Guard de rutas. Se usa como ruta padre sin path:
 * <Route element={<RequireRole roles={['CURADOR']} />}> ...rutas hijas... </Route>
 */
export function RequireRole({ roles }: RequireRoleProps) {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!isTokenValid(token)) return <Navigate to="/login" replace />;
  if (!roles) return <Outlet />;
  if (!user) return null;

  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Card className="ring-border shadow-none">
          <CardHeader>
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldAlert className="size-5" />
            </span>
            <CardTitle className="mt-2 text-title">No tenés permisos</CardTitle>
            <CardDescription>
              Tu rol no tiene acceso a esta sección del museo.
            </CardDescription>
            <Button className="mt-4 w-fit" variant="outline" onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}