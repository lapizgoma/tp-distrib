/** Cuerpo de POST /api/rest/auth/login. */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/** Respuesta de POST /api/rest/auth/login. No incluye al usuario. */
export interface LoginResponseDTO {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // segundos (3600)
}

