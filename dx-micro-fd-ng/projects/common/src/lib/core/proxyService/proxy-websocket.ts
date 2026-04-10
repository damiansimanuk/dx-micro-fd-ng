
import { BehaviorSubject, finalize, map, Observable, Subject } from "rxjs";
import { Client, type IWSClientAdditionalOptions, type NodeWebSocketTypeOptions } from "rpc-websockets";
import type { EventDto, IConnectionResolver } from "./proxy-factory";


if (typeof window == "undefined") {
  (globalThis as any).sessionStorage = null!
}

export class ProxyWebsocket implements IConnectionResolver {
  #client!: Client;
  #events: Map<string, Subject<EventDto>> = new Map();
  #isConnected$ = new BehaviorSubject<boolean>(false);
  #currentUser$ = new BehaviorSubject<{ username: string, token: string } | null>(null);

  get IsConnected() {
    return this.#isConnected$.asObservable()
  }

  get UserChanged() {
    return this.#currentUser$.asObservable()
  }

  get CurrentUser() {
    return this.#currentUser$.value
  }

  constructor(
    public url: string,
    public config?: IWSClientAdditionalOptions & NodeWebSocketTypeOptions
  ) {
    this.reconnect(config)
  }

  public reconnect(config?: IWSClientAdditionalOptions & NodeWebSocketTypeOptions) {
    if (this.#client != null) {
      this.#isConnected$.next(false)
      this.#client.off('close');
      this.#client.off('open');
      this.#client.off('event.notification');
      this.#client.close()
    }

    this.#client = new Client(this.url, {
      autoconnect: true,
      headers: {
        AUTORIZATION: "Bearer qwrwqerewr"
      },
      ...config,
    });

    this.#client.on('close', this.onClose.bind(this));
    this.#client.on('open', this.onOpen.bind(this));
    this.#client.on('event.notification', this.OnEvent.bind(this));
  }

  public request<T>(proxyName: string, objectId: string | undefined, method: string | null, args: any[]) {
    return this.#client
      .call("request", { proxyName, objectId, method, args })
      .then(d => d as T)
  }

  public subscribe(proxyName: string, objectId: string | undefined, eventName: string) {
    let eventKey = `${objectId}_${eventName}`

    let subject = this.#events.get(eventKey);
    if (subject == null) {
      subject = new Subject<EventDto>()
      this.#events.set(eventKey, subject);
    }

    this.#client.call("subscribe", { proxyName, objectId, eventName }).catch();

    return subject.pipe(
      finalize(() => {
        if (!subject.observed) {
          setTimeout(() => this.safeUnsubscribe(proxyName, objectId, eventName), 2000);
        }
      })
    )
  }

  public signin(user: string, password: string | null) {
    var args = password != null
      ? [user, password]
      : [user]

    return this.#client
      .call("signin", { args })
      .then((r: any) => {
        console.log("signin", r)
        sessionStorage?.setItem("token", r.Item2)
        this.#currentUser$.next({ username: r.Item1, token: r.Item2 });
        return this.#currentUser$.value
      })
      .catch(e => {
        console.error("signin *****", e.message)
        this.#currentUser$.next(null)
        return null
      })
  }

  public signout() {
    return this.#client
      .call("signout", {})
      .catch()
      .finally(() => {
        console.log("signout")
        sessionStorage?.removeItem("token")
        this.#currentUser$.next(null)
      })
  }

  private safeUnsubscribe(proxyName: string, objectId: string | undefined, eventName: string) {
    let eventKey = `${objectId}_${eventName}`
    let subject = this.#events.get(eventKey);

    if (subject != null && !subject.observed) {
      console.log(`Limpiando suscripción para: ${eventKey}`);
      this.#events.delete(eventKey);
      if (this.#isConnected$.value)
        this.#client.call("unsubscribe", { proxyName, objectId, eventName });
    }
  }

  private onClose() {
    console.debug("************** event ws on close");
    this.#isConnected$.next(false)
  }

  private onOpen() {
    console.debug("************** event ws on open");
    this.#isConnected$.next(true)
    var token = sessionStorage?.getItem("token")
    console.log("Try connect token", token)
    if (token != null) {
      this.signin(token, null)
    }
  }

  private OnEvent(message: EventDto) {
    var eventKey = `${message.ObjectId}_${message.EventName}`
    this.#events.get(eventKey)?.next(message)
  }
}

