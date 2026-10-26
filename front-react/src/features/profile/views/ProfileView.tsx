import { useState, type FormEvent } from 'react';
import { Palette, Save, Sparkles, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { CriteriaChipGroup } from '@/features/tour/components/CriteriaChipGroup';
import type { UserRole } from '@/features/auth/types/user-role.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '../hooks/useProfile';
import {
  ERA_OPTIONS,
  TECHNIQUE_OPTIONS,
  TOPIC_OPTIONS,
  type Topic,
  type UserPreferences,
  type UserPreferencesRequestDTO,
} from '../types/profile.types';
import type { Era, Technique } from '@/features/works/types/works.types';

const ROLE_LABELS: Record<UserRole, string> = {
  VISITANTE: 'Visitante',
  CURADOR: 'Curador',
  ADMINISTRADOR: 'Administrador',
};

function toggleValue<T extends string>(current: T[], value: string): T[] {
  const typed = value as T;
  return current.includes(typed)
    ? current.filter((item) => item !== typed)
    : [...current, typed];
}

function initials(user: { firstName: string; lastName: string; email: string }): string {
  const first = user.firstName?.trim().charAt(0);
  const last = user.lastName?.trim().charAt(0);
  if (first || last) return `${first}${last}`.toUpperCase();
  return user.email.charAt(0).toUpperCase();
}

function preferencesKey(preferences: UserPreferences): string {
  return [
    preferences.userId,
    preferences.favoriteTopics.join('|'),
    preferences.favoriteTechniques.join('|'),
    preferences.favoriteEras.join('|'),
  ].join(':');
}

interface PreferencesFormProps {
  preferences: UserPreferences;
  saving: boolean;
  onSave: (payload: UserPreferencesRequestDTO) => Promise<UserPreferences | null>;
  onClear: () => Promise<boolean>;
}

function PreferencesForm({ preferences, saving, onSave, onClear }: PreferencesFormProps) {
  const [topics, setTopics] = useState<Topic[]>(preferences.favoriteTopics ?? []);
  const [techniques, setTechniques] = useState<Technique[]>(preferences.favoriteTechniques ?? []);
  const [eras, setEras] = useState<Era[]>(preferences.favoriteEras ?? []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await onSave({
      favoriteTopics: topics,
      favoriteTechniques: techniques,
      favoriteEras: eras,
    });
    if (result) toast.success('Preferencias guardadas');
  };

  const handleClear = async () => {
    if (!window.confirm('¿Borrar todas tus preferencias?')) return;
    const ok = await onClear();
    if (ok) toast.success('Preferencias borradas');
  };

  return (
    <Card className="ring-border shadow-none">
      <CardHeader>
        <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-5" />
        </span>
        <CardTitle className="mt-2">Preferencias</CardTitle>
        <CardDescription>
          Elegí tus temas, técnicas y épocas favoritas. Podés cambiarlas cuando quieras.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CriteriaChipGroup
            legend="Temas"
            description="Temas que te interesan de las obras del museo."
            options={TOPIC_OPTIONS}
            selected={topics}
            onToggle={(value) => setTopics((current) => toggleValue(current, value))}
          />

          <CriteriaChipGroup
            legend="Técnicas"
            description="Técnicas con las que disfrutás más el arte."
            options={TECHNIQUE_OPTIONS}
            selected={techniques}
            onToggle={(value) => setTechniques((current) => toggleValue(current, value))}
          />

          <CriteriaChipGroup
            legend="Épocas"
            description="Períodos artísticos que te gustaría explorar."
            options={ERA_OPTIONS}
            selected={eras}
            onToggle={(value) => setEras((current) => toggleValue(current, value))}
          />

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button type="submit" disabled={saving}>
              <Save className="size-4" />
              {saving ? 'Guardando...' : 'Guardar preferencias'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={handleClear}
            >
              <Trash2 className="size-4" />
              Borrar preferencias
            </Button>
            {topics.length + techniques.length + eras.length === 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Palette className="size-3.5" />
                Todavía no elegiste preferencias.
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ProfileView() {
  const { user, preferences, loading, saving, error, reload, save, clear } = useProfile();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="inline-flex w-fit items-center gap-2 text-caption font-medium text-primary">
          <UserRound className="size-3.5" />
          Mi perfil
        </span>
        <h1 className="font-heading text-title font-semibold">Mis datos y preferencias</h1>
        <p className="text-sm text-muted-foreground">
          Revisá tu información de cuenta y contanos qué arte te gusta para personalizar tu experiencia.
        </p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar tu perfil</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>{error}</span>
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={reload}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      )}

      {!loading && user && (
        <>
          <Card className="ring-border shadow-none">
            <CardHeader className="flex flex-row items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {initials(user)}
              </span>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <Badge variant="secondary" className="w-fit">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <dt className="text-caption text-muted-foreground">Email</dt>
                  <dd className="text-sm font-medium">{user.email}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-caption text-muted-foreground">Rol</dt>
                  <dd className="text-sm font-medium">{ROLE_LABELS[user.role]}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-caption text-muted-foreground">ID de usuario</dt>
                  <dd className="text-sm font-medium">#{user.id}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {preferences && (
            <PreferencesForm
              key={preferencesKey(preferences)}
              preferences={preferences}
              saving={saving}
              onSave={save}
              onClear={clear}
            />
          )}
        </>
      )}
    </div>
  );
}
