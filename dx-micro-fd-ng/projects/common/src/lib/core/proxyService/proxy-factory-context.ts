import { BehaviorSubject, filter, Subscription } from "rxjs";
import type { IConnectionResolver } from "./proxy-factory";

export type TContext = {
  proxyName?: string;
  parent?: ContextBase;
  connection?: IConnectionResolver;
  initMethod?: string | null;
  initArgs?: any[];
}

export abstract class ContextBase {
  #sub1!: Subscription;
  #isConnected = new BehaviorSubject<boolean>(false)
  readonly parent!: ContextBase
  readonly proxyName!: string
  readonly connection!: IConnectionResolver
  protected objectId: string | undefined
  readonly initMethod: string | null = null
  readonly initArgs: any[] = []
  get onConnected() { return this.#isConnected.pipe(filter(e => e == true)) }
  get onDisconnected() { return this.#isConnected.pipe(filter(e => e == false)) }

  constructor(context: TContext) {
    if (context.parent != null) {
      console.log("Create context with parent", context.parent.proxyName, context.initMethod, context.initArgs)
      this.parent = context.parent
      this.proxyName = context.parent.proxyName
      this.connection = context.parent.connection
      this.initMethod = context.initMethod ?? null
      this.initArgs = context.initArgs ?? []
      this.parent.#isConnected.subscribe(e => this.#onConnectionChanged(e))
    }
    else {
      console.log("Create parent context", context.proxyName)
      this.proxyName = context.proxyName!
      this.connection = context.connection!
      this.connection.IsConnected.subscribe(e => this.#onConnectionChanged(e))
    }
  }

  request<T>(method: string | null, args: any[]) {
    if (!this.#isConnected.value)
      throw new Error(`Context '${this.proxyName}' is not connected`)
    return this.connection.request<T>(this.proxyName, this.objectId, method, args)
  }

  subscribe(eventName: string) {
    if (!this.#isConnected.value)
      throw new Error(`Context '${this.proxyName}' is not connected`)
    return this.connection.subscribe(this.proxyName, this.objectId, eventName)
  }

  #initialize() {
    console.debug("initialize", this.initMethod, this.initArgs)
    return this.connection
      .request<any>(this.proxyName, this.parent?.objectId, this.initMethod, this.initArgs)
      .then(d => {
        console.debug("initialize", this.initMethod, this.initArgs, d)
        this.objectId = <string>d["objectId"]
        this.#isConnected.next(true)
        if (this.parent == null) {
          this.#sub1?.unsubscribe()
          this.#sub1 = this.subscribe("ConnectionChanged").subscribe(e => this.#onConnectionChanged(e.EventData.isConnected))
        }
      })
  }

  #onConnectionChanged(isConnected: boolean) {
    if (isConnected == this.#isConnected.value)
      return

    if (isConnected)
      this.#initialize()
    else
      this.#isConnected.next(false)
  }
}
