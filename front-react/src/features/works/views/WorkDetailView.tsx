import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWork } from '../hooks/useWork';
import { addComment } from '../api/commentsRestApi';
import { AVAILABILITY_LABELS, LOCATION_LABELS, ERA_LABELS, TECHNIQUE_LABELS } from '../types/works.types';
import { ArrowLeft, Palette, User, Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function WorkDetailView() {
  const { id } = useParams<{ id: string }>();
  const { work, loading, error, refetch } = useWork(id);

  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await addComment(id, { text: commentText.trim() });
      setCommentText('');
      await refetch(); 
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message || 'Error al enviar el comentario');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Cargando detalles de la obra...</p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center space-y-4">
        <p className="text-destructive font-semibold text-lg">{error || 'Obra no encontrada'}</p>
        <Button variant="outline" render={<Link to="/obras" />}>
          <ArrowLeft className="size-4 mr-2" />
          Volver al catálogo
        </Button>
      </div>
    );
  }

  const isAvailable = work.availability === 'EN_EXHIBICION';

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
      {/* Botón Volver */}
      <Button variant="ghost" size="sm" render={<Link to="/obras" />} className="gap-2">
        <ArrowLeft className="size-4" />
        Volver al catálogo
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="rounded-xl overflow-hidden bg-muted border border-border h-80 md:h-[420px] flex items-center justify-center relative shadow-sm">
          {work.image_url ? (
            <img src={work.image_url} alt={work.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Palette className="size-16 opacity-30" />
              <span className="text-sm">Sin imagen disponible</span>
            </div>
          )}
          <span
            className={`absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-semibold uppercase shadow-sm ${
              isAvailable
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {AVAILABILITY_LABELS[work.availability] || work.availability}
          </span>
        </div>

        {/* Información Técnica */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{work.title}</h1>
            <p className="text-lg font-medium text-primary mt-1">
              {work.artist?.name || 'Artista desconocido'}
            </p>
          </div>

          <p className="text-muted-foreground leading-relaxed text-sm">
            {work.description || 'Sin descripción disponible.'}
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-border py-4">
            <div>
              <span className="text-muted-foreground block">Año:</span>
              <span className="font-semibold text-foreground">{work.creation_year || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Técnica:</span>
              <span className="font-semibold text-foreground">
                {TECHNIQUE_LABELS[work.technique] || work.technique || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Época:</span>
              <span className="font-semibold text-foreground">
                {ERA_LABELS[work.era] || work.era || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Ubicación:</span>
              <span className="font-semibold text-foreground">
                {LOCATION_LABELS[work.location] || work.location || 'N/A'}
              </span>
            </div>
          </div>

          {/* Biografía del Artista */}
          {work.artist?.biography && (
            <div className="rounded-lg bg-card border border-border p-4 text-xs space-y-1">
              <p className="font-semibold text-foreground">Sobre el autor:</p>
              <p className="text-muted-foreground">{work.artist.biography}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Comentarios */}
      <div className="space-y-6 border-t border-border pt-8">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" />
          Comentarios ({work.comments?.length || 0})
        </h2>

        {/* Formulario para agregar comentario */}
        <form onSubmit={handleAddComment} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escribe tu opinión o reseña sobre esta obra..."
            rows={3}
            className="w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
          />
          {submitError && <p className="text-xs text-destructive">{submitError}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !commentText.trim()} className="gap-2">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Publicar comentario
            </Button>
          </div>
        </form>

        {/* Lista de Comentarios */}
        <div className="space-y-3">
          {work.comments && work.comments.length > 0 ? (
            work.comments.map((comment, index) => (
              <Card key={comment.id || index} className="bg-card">
                <CardContent className="p-4 space-y-1">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <User className="size-3.5" />
                      {comment.user || 'Visitante'}
                    </span>
                    <span>{comment.date || 'Reciente'}</span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-1">{comment.text}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
              Esta obra aún no tiene comentarios. ¡Sé el primero en dejar tu opinión!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}