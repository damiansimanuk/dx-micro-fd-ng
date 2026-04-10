import { plainToInstance } from "class-transformer";
import { Observable } from "rxjs";

export type EventDto<T = any> = {
  ProxyName: string,
  ObjectId: string,
  EventName: string,
  EventData: T
  CreatedAt: string,
}

// export interface IProxy<TProps = Record<string, any>> {
//   GetProxyProperties(): Promise<TProps>
//   subscribe_ConnectionChanged(): Observable<EventDto<{ isConnected: boolean }>>
// }



export interface IConnectionResolver {
  IsConnected: Observable<boolean>
  UserChanged: Observable<{ username: string, token: string } | null>
  CurrentUser: { username: string, token: string } | null
  request<T>(proxyName: string, objectId: string | undefined, method: string | null, args: any[]): Promise<T>
  subscribe(proxyName: string, objectId: string | undefined, eventName: string): Observable<EventDto>
  signin(user: string, password: string | null): Promise<{ username: string, token: string } | null>
  signout(): Promise<unknown>
}

export async function createProxy<T extends object>(
  connection: IConnectionResolver,
  proxyMethods: string[],
  proxyName: string,
  initMethod: string | null = null,
  initArgs: any[] = [],
  objectId: string | undefined = undefined,
) {
  console.debug('create proxy', { initMethod, initArgs });

  return connection.request<any>(proxyName, objectId, initMethod, initArgs)
    .then(data => {
      let context = {
        proxyName,
        objectId: data["objectId"],
        type: data["type"],
      }

      return new Proxy({ context } as any as T, {
        get(_, prop) {

          if (typeof prop === 'symbol') {
            return undefined;
          }
          if (['then', 'catch', 'finally'].includes(prop)) {
            return undefined;
          }

          return (...args: any[]) => {
            console.debug(`*** Invocando en ${prop}(${args})`);

            if (prop === 'GetProxyProperties') {
              return connection.request(proxyName, context.objectId, prop, args);
            }

            if (prop.startsWith("subscribe_")) {
              var eventName = prop.replace("subscribe_", "")
              return connection.subscribe(proxyName, context.objectId, eventName)
            }

            if (proxyMethods.includes(prop)) {
              return createProxy(connection, proxyMethods, proxyName, prop, args, context.objectId);
            }

            return connection
              .request(proxyName, context.objectId, prop, args)
          };
        }
      });
    }).catch(err => {
      console.error("errror", err)
      throw err
    })
};


