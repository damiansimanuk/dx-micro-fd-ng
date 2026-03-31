import { ProxyWebsocket } from "./proxy-websocket";
import { createProxy, type EventDto } from "./proxy-factory";
import { Observable } from "rxjs";

const url = 'ws://localhost:8181'
const factoryMethods = ['Zones_GetByCode'];

interface ITrackingManager {
    Zones_GetByCode(code: string): Promise<IZone>
}

interface IZone {
    Tracking: Tracking[]
    IsLoadableAsDestination(position: number, count: number): Promise<boolean>
    subscribe_ZoneChanged(): Observable<EventDto<ZoneChangedEventArgs>>
}

type Tracking = {
    Attributes: Record<string, unknown>;
    Status: number;
    Id: number;
    TrackingType: number;
    TraceabilityNumber: number;
    TraceabilitySubNumber: number;
    TraceabilityCode: string;
    TraceabilitySubCode: string;
    IdProductionHistory: number;
    SortOrder: number;
    IdZone: number;
    IsInverted: boolean;
}

type ZoneChangedEventArgs = {
    Tracking: Tracking[];
    TimeStamp: string;
}

const connection = new ProxyWebsocket(url)

connection.IsConnected.subscribe(async (connected) => {
    console.log({ connected })

    if (connected) {
        const manager = await createProxy<ITrackingManager>(connection, factoryMethods, "Tenaris.Manager.Tracking.TrackingManager.Proxy");
        console.log({ manager })
        // const zone = await manager.Zones_GetByCode("ENTRADA_SELADORA");
        const zone = await manager.Zones_GetByCode("ENTRADA_INSP_PRENS_O");
        var tracking = zone.Tracking
        console.log({ zone, tracking: tracking[80] })
        console.log({ Attributes_Batch: tracking[80]?.Attributes["Batch"] })
        var isLoadable = await zone.IsLoadableAsDestination(0, 1);
        console.log({ isLoadable })
        var sub = zone.subscribe_ZoneChanged();
        sub.subscribe(e => {
            console.log("Event zone changed", { time: e.EventData.TimeStamp, tracking_0: e.EventData.Tracking?.at(0)?.TraceabilityCode, })
        })
    }
})

export { };
