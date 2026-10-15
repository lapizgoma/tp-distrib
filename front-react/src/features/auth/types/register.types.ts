/** Cuerpo de POST /api/rest/auth/register. */
export interface RegisterRequestDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string; // mínimo 8 caracteres
  confirmPassword: string;
}