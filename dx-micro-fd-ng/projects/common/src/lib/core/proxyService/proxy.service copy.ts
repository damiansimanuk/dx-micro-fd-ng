import { makeStateKey, Signal, signal, WritableSignal } from "@angular/core"

type PContextData = {
    Props: Record<string, any>
    Methods: string[]
    Events: string[]
}



interface IQueryResolver {
    post<T>(proxyName: string, objectId: string | null, method: string, args: any[]): Promise<T>
    suscribe<T>(proxyName: string, objectId: string | null, event: string, callBack: ((msg: any) => void)): Promise<void>
}


class TrackingManager {
    IsActive?: boolean
    ProxyName: string
    ObjectId: string | null = null!
    private events: Map<string, WritableSignal<any>> = new Map();

    constructor(
        proxyName: string,
        public resolver: IQueryResolver
    ) {
        this.ProxyName = proxyName
    }

    public initialize() {
        return this.resolver
            .post<PContextData>(this.ProxyName, null, "INIT", [])
            .then(data => {
                Object.assign(this, data.Props)
                return this.IsActive ?? false
            })
            .catch(e => false)
    }

    public GetZoneByCode(code: string) {
        return this.resolver
            .post<PContextData>(this.ProxyName, this.ObjectId, "GetZoneByCode", [code])
            .then(data => new TrackingZone(this, data))
    }

    private OnEvent(event: string, message: any) {
        this.events.get(event)?.set(message)
    }

    public subscribe(event: string) {
        if (!this.events.has(event)) {
            const s = signal<any>(null);
            this.resolver.suscribe(this.ProxyName, this.ObjectId, event, msg => this.OnEvent(event, msg))
            this.events.set(event, s);
        }

        return this.events.get(event)!.asReadonly();
    }

    public unsubscribe(event: string) {
        if (this.events.has(event)) { 
            this.resolver.unsubsribe?.(this.ProxyName, this.ObjectId, event); 
            this.events.delete(event);
        }
    }


class TrackingZone {
    Code: string = null!
    ObjectId: string = null!

    constructor(
        public parent: TrackingManager,
        public data: PContextData
    ) {
        Object.assign(this, data.Props)
    }

    public GetTracking(idTracking: number) {
        this.parent.resolver.post(this.parent.ProxyName, this.ObjectId, "GetTracking", [idTracking])
    }
}


var tm = new TrackingManager("TrackingManager.Proxy", null!)
await tm.initialize()
var zone1 = await tm.GetZoneByCode("Zone1")


export { }

