import 'reflect-metadata';
import { plainToInstance, Type } from "class-transformer";
import { BehaviorSubject, map, Subscription } from "rxjs";
import type { IConnectionResolver } from "./proxy-factory";
import { ContextBase, type TContext } from "./proxy-factory-context";
import { ProxyWebsocket } from "./proxy-websocket";

/**
 * 
 * Logica de Tracking Manager (Proxy)
 * 
*/

export class TrackingManager extends ContextBase {
  zones = new Map<string, ZoneContext>();

  constructor(connection: IConnectionResolver, proxyName: string) {
    super({ proxyName, connection });
  }

  getProperties() {
    return this.request("GetProxyProperties", [])
      .then(d => plainToInstance(TrackinProp, d))
  }

  getZone(zoneCode: string) {
    let zone = this.zones.get(zoneCode);
    if (zone == null) {
      zone = new ZoneContext(this, zoneCode)
      this.zones.set(zoneCode, zone);
    }
    return zone;
  }

  get Trackings() {
    return this.request<any[]>("get_Trackings", [])
      .then((d) => plainToInstance(Tracking, d))
  }

  get Zones() {
    return this.request<any[]>("get_Zones", [])
      .then((d) => plainToInstance(ZoneProp, d))
  }

  isLoadableAsDestination(position: number, count: number) {
    return this.request("IsLoadableAsDestination", [position, count])
      .then(d => !!d)
  }
}

/**
 * 
 * Logica de Tracking.Zone (Proxy)
 * 
*/

export class ZoneContext extends ContextBase {

  constructor(parent: TrackingManager, zoneCode: string) {
    super({ parent, initMethod: "Zones_GetByCode", initArgs: [zoneCode] });
  }

  getProperties() {
    return this.request("GetProxyProperties", [])
      .then(d => plainToInstance(ZoneProp, d))
  }

  onZoneChanged() {
    return this.subscribe("ZoneChanged")
      .pipe(map(e => plainToInstance(ZoneChangedEventArgs, e.EventData)))
  }

  isLoadableAsDestination(position: number, count: number) {
    return this.request("IsLoadableAsDestination", [position, count])
      .then(d => Boolean(d))
  }
}

/** 
 * Dto
 * 
 * aca uso  'reflect-metadata' y "class-transformer" 
 * para convertir los objetos json a objetos mas nativos de TS. como Date.
 * La verdad no hay muchas formas de hacerlo dinamicamete. 
 * Pero una forma mas eficiente seria haciendo manualmente
 * 
*/
export class ZoneChangedEventArgs {
  @Type(() => Tracking)
  Tracking!: Tracking[];
  @Type(() => Date)
  TimeStamp!: Date;
}

export class TrackinProp {
  Code!: string
  Trackings!: Tracking[]
  Zones!: any[]
}

export class ZoneProp {
  Code!: string
  Tracking!: Tracking[]
}

export class Tracking {
  Attributes!: Record<string, unknown>;
  Status!: number;
  Id!: number;
  TrackingType!: number;
  TraceabilityNumber!: number;
  TraceabilitySubNumber!: number;
  TraceabilityCode!: string;
  TraceabilitySubCode!: string;
  IdProductionHistory!: number;
  SortOrder!: number;
  IdZone!: number;
  IsInverted!: boolean;
}


/**
 * Ejemplo de uso
 * 
 * Hay que tener en cuenta que los proxy deben ser singleton.
 * Tanto ProxyWebsocket como TrackingContext deben ser singleton.
 * Luego ZoneContext es estatico dentro del TrackingContext
 * 
 * Tambien hay que tener en cuenta que toda subscipcion (objeto Subscription) requieres ser liberada (unsubscribe)
 * Ver en el ejemplo. que siempre atienede el cambio de zona pero el objeto se libera.
*/

const connection = new ProxyWebsocket('ws://localhost:8181')
var trackingAdapter = new TrackingManager(connection, "Tenaris.Manager.Tracking.TrackingManager.Proxy")
// var zone = trackingAdapter.getZone("SAIDA_SELADORA")
var zone = trackingAdapter.getZone("ENTRADA_SELADORA")

var sub1: Subscription
var trackings: Tracking[] = []

connection.UserChanged.subscribe(u => {

  if (u == null)
    return

  zone.onConnected.subscribe(async () => {
    // zone.getProperties().then(r => trackings = r.Tracking)

    sub1 = zone.onZoneChanged().subscribe(e => {
      trackings = e.Tracking
      console.log("ZoneChanged", e.TimeStamp, e.Tracking.length, "lastTracking:", e.Tracking.at(0)?.TraceabilityCode)
    })

    var props = await trackingAdapter.getProperties();
    // console.log("trackingAdapter props", props)
    console.log("trackingAdapter props Zones", props.Zones.at(0))
    // console.log("trackingAdapter props Tracking", props.Trackings)

    var result = await zone.isLoadableAsDestination(1, 2)
    console.log("isLoadableAsDestination", result)
  })

  zone.onDisconnected.subscribe(() => {
    sub1?.unsubscribe()
  })
})

connection.IsConnected.subscribe(e => {
  if (e) {
    connection.signin("T22122", "Automation#128") 
  }
})


trackingAdapter.onConnected.subscribe(async () => {
  var trackings = await trackingAdapter.Trackings
  console.log("Trackings", trackings[0])
  var zones = await trackingAdapter.Zones
  console.log("Zones", zones[0])
})
