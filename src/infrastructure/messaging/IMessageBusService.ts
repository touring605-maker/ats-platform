export interface DomainEvent {
  id: string;
  type: string;
  version: string;
  tenantId: string;
  occurredAt: string;
  actorId: string;
  data: Record<string, unknown>;
}

export interface IMessageBusService {
  publish(topic: string, event: DomainEvent): Promise<void>;
  subscribe(topic: string, handler: (event: DomainEvent) => Promise<void>): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
}
