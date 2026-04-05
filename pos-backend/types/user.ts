/**
 * Payload for creating a user (registration / admin create).
 */
export interface RegisterUserPayload {
  name: string;
  phone: string;
  password: string;
  role: string;
  email?: string;
}
