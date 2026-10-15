import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useLogin } from '../hooks/useLogin';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginFormState {
  email: string;
  password: string;
}

type LoginErrors = Partial<Record<keyof LoginFormState, string>>;

/** Inicio de sesión: POST /auth/login y luego GET /auth/me. */
export function LoginView() {
  const navigate = useNavigate();
  const { submit, submitting, error, fieldErrors } = useLogin();

  const [form, setForm] = useState<LoginFormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});

  const setField = <K extends keyof LoginFormState>(key: K, val: LoginFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const validate = (): LoginErrors => {
    const next: LoginErrors = {};
    if (!form.email.trim()) next.email = 'El email es obligatorio.';
    if (!form.password) next.password = 'La contraseña es obligatoria.';
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const ok = await submit({ email: form.email.trim(), password: form.password });
    if (ok) {
      toast.success('Sesión iniciada');
      navigate('/');
    }
  };

  const emailError = errors.email ?? fieldErrors.email;
  const passwordError = errors.password ?? fieldErrors.password;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Card className="ring-border shadow-none">
        <CardHeader>
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LogIn className="size-5" />
          </span>
          <CardTitle className="mt-2 text-title">Iniciar sesión</CardTitle>
          <CardDescription>Ingresá con tu email y tu contraseña.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="tu@email.com"
                aria-invalid={Boolean(emailError)}
              />
              <FieldError errors={emailError ? [{ message: emailError }] : undefined} />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                aria-invalid={Boolean(passwordError)}
              />
              <FieldError errors={passwordError ? [{ message: passwordError }] : undefined} />
            </Field>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
              Registrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}