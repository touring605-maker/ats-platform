export interface ISecretsService {
  getSecret(name: string): Promise<string>;
  setSecret(name: string, value: string): Promise<void>;
  deleteSecret(name: string): Promise<void>;
  listSecretNames(): Promise<string[]>;
}
