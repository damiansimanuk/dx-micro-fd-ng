import { makeStateKey, Signal, signal, WritableSignal } from "@angular/core"
import { ProxyWebsocket } from "./proxy-websocket";



class TrackingManager {
    IsActive?: boolean
    ProxyName: string
    ObjectId: string | null = null!

    constructor(
        proxyName: string,
        public proxy: ProxyWebsocket
    ) {
        this.ProxyName = proxyName
    }

    public initialize() {
        return this.proxy
            .request(this.ProxyName, null, "_init_", [])
            .then(data => {
                Object.assign(this, data)
                return this.IsActive ?? false
            })
            .catch(e => false)
    }

    public GetZoneByCode(code: string) {
        return this.proxy
            .request(this.ProxyName, this.ObjectId, "GetZoneByCode", [code])
            .then(data => new TrackingZone(this, data))
    }

    public subscribe(event: string) {
        return this.proxy.subscribe(this.ProxyName, this.ObjectId, event)
    }
}

class TrackingZone {
    Code: string = null!
    ObjectId: string = null!

    constructor(public parent: TrackingManager, initData: unknown) {
        Object.assign(this, initData)
    }

    public GetTracking(idTracking: number) {
        this.parent.proxy.request(this.parent.ProxyName, this.ObjectId, "GetTracking", [idTracking])
    }
}


var tm = new TrackingManager("TrackingManager.Proxy", null!)
await tm.initialize()
var zone1 = await tm.GetZoneByCode("Zone1")


export { }

