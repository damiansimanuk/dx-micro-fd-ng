
import { Client } from "rpc-websockets";
import { BehaviorSubject, filter, finalize, Subject } from "rxjs";
import type { EventDto, IConnectionResolver } from "./proxy-factory";


export class ProxyWebsocket implements IConnectionResolver {
  #client: Client;
  #events: Map<string, BehaviorSubject<EventDto>> = new Map();
  #isConnected$ = new Subject<boolean>();

  get IsConnected() {
    return this.#isConnected$.asObservable()
  }

  constructor(url: string) {
    this.#client = new Client(url, {
      autoconnect: true, headers: {
        AUTORIZATION: "Bearer qwrwqerewr"
      }
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
    var eventKey = `${objectId}_${eventName}`

    // send request to server
    if (!this.#events.has(eventKey)) {
      const s = new BehaviorSubject<EventDto>(null!);
      this.#events.set(eventKey, s);
      this.#client.call("subscribe", { proxyName, objectId, eventName });
    }

    const subject = this.#events.get(eventKey)!;

    return subject.pipe(
      filter(val => val !== null),
      finalize(() => {
        // clean subscriptions
        if (!subject.observed) {
          console.log(`Limpiando suscripción para: ${eventKey}`);
          this.#client.call("unsubscribe", { proxyName, objectId, eventName });
          this.#events.delete(eventKey);
        }
      })
    )
  }

  private async onClose() {
    console.debug("************** event ws on close:");
    this.#isConnected$.next(false)
  }

  private async onOpen(result: unknown) {
    console.debug("************** event ws on open:", result);
    this.#isConnected$.next(true)
  }

  private OnEvent(message: EventDto) { 
    var eventKey = `${message.ObjectId}_${message.EventName}`
    this.#events.get(eventKey)?.next(message)
  }

}

