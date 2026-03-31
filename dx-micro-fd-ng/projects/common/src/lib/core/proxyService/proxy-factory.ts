
import { Observable } from "rxjs";

export type EventDto<T = unknown> = {
  ProxyName: string,
  ObjectId: string,
  EventName: string,
  EventData: T
  CreatedAt: string,
}

export interface IConnectionResolver {
  IsConnected: Observable<boolean>
  request<T>(proxyName: string, objectId: string | undefined, method: string | null, args: any[]): Promise<T>
  subscribe(proxyName: string, objectId: string | undefined, eventName: string): Observable<EventDto>
}

export type PContext = {
  proxyName: string;
  objectId: string;
  type: string;
  properties: any
}

export async function createProxy<T extends object>(
  connection: IConnectionResolver,
  factoryMethods: string[],
  proxyName: string,
  initMethod: string | null = null,
  initArgs: any[] = [],
  parent: PContext | null = null
) {
  console.debug('create proxy', { initMethod, initArgs });

  return connection.request<any>(proxyName, parent?.objectId, initMethod, initArgs)
    .then(data => {
      let context: PContext = {
        proxyName,
        objectId: data["__ObjectId"],
        type: data["__Type"],
        properties: data
      }

      return new Proxy({ context } as T, {
        get(_, prop) {

          if (typeof prop === 'symbol') {
            return undefined;
          }
          if (['then', 'catch', 'finally'].includes(prop)) {
            return undefined;
          }
          if (prop in context.properties) {
            return context.properties[prop];
          }

          return (...args: any[]) => {
            console.debug(`*** Invocando en ${prop}(${args})`);

            if (prop.startsWith("subscribe_")) {
              var eventName = prop.replace("subscribe_", "")
              return connection.subscribe(proxyName, context.objectId, eventName)
            }

            if (factoryMethods.includes(prop)) {
              return createProxy(connection, factoryMethods, proxyName, prop, args, context);
            }

            return connection.request(proxyName, context.objectId, prop, args);
          };
        }
      });
    })
};


