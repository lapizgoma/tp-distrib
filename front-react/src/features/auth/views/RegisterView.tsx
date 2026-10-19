import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useRegister } from '../hooks/useRegister';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RegisterFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type RegisterErrors = Partial<Record<keyof RegisterFormState, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Registro de usuario: POST /auth/register y luego redirección al login. */
export function RegisterView() {
  const navigate = useNavigate();
  const { submit, submitting, error, fieldErrors } = useRegister();

  const [form, setForm] = useState<RegisterFormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<RegisterErrors>({});

  const setField = <K extends keyof RegisterFormState>(key: K, val: RegisterFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const validate = (): RegisterErrors => {
    const next: RegisterErrors = {};
    if (!form.firstName.trim()) next.firstName = 'El nombre es obligatorio.';
    if (!form.lastName.trim()) next.lastName = 'El apellido es obligatorio.';
    if (!form.email.trim()) {
      next.email = 'El email es obligatorio.';
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      next.email = 'El email no tiene un formato válido.';
    }
    if (!form.password) {
      next.password = 'La contraseña es obligatoria.';
    } else if (form.password.length < 8) {
      next.password = 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (!form.confirmPassword) {
      next.confirmPassword = 'Confirmá la contraseña.';
    } else if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Las contraseñas no coinciden.';
    }
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const ok = await submit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    });

    if (ok) {
      toast.success('Cuenta creada. Ya podés iniciar sesión.');
      navigate('/login');
    }
  };

  const firstNameError = errors.firstName ?? fieldErrors.firstName;
  const lastNameError = errors.lastName ?? fieldErrors.lastName;
  const emailError = errors.email ?? fieldErrors.email;
  const passwordError = errors.password ?? fieldErrors.password;
  const confirmPasswordError = errors.confirmPassword ?? fieldErrors.confirmPassword;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Card className="ring-border shadow-none">
        <CardHeader>
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <UserPlus className="size-5" />
          </span>
          <CardTitle className="mt-2 text-title">Crear cuenta</CardTitle>
          <CardDescription>Registrate para acceder al museo virtual.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="firstName">Nombre</FieldLabel>
                <Input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  placeholder="Juan"
                  aria-invalid={Boolean(firstNameError)}
                />
                <FieldError errors={firstNameError ? [{ message: firstNameError }] : undefined} />
              </Field>

              <Field>
                <FieldLabel htmlFor="lastName">Apellido</FieldLabel>
                <Input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  placeholder="Pérez"
                  aria-invalid={Boolean(lastNameError)}
                />
                <FieldError errors={lastNameError ? [{ message: lastNameError }] : undefined} />
              </Field>
            </div>

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
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                aria-invalid={Boolean(passwordError)}
              />
              <FieldError errors={passwordError ? [{ message: passwordError }] : undefined} />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                aria-invalid={Boolean(confirmPasswordError)}
              />
              <FieldError
                errors={confirmPasswordError ? [{ message: confirmPasswordError }] : undefined}
              />
            </Field>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
              Iniciá sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
