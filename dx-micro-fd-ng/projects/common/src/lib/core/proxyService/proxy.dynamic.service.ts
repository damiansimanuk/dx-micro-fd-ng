import 'reflect-metadata';
import { ProxyWebsocket } from "./proxy-websocket";
import { createProxy, type EventDto } from "./proxy-factory";
import { Observable } from "rxjs";
import { instanceToInstance, plainToClass, plainToClassFromExist, plainToInstance, Type, type ClassConstructor } from 'class-transformer';
import { KeyObject } from 'node:crypto';

const url = 'ws://localhost:8181'
const proxyMethods = ['Zones_GetByCode'];



interface ITrackingManager {
    Zones_GetByCode(code: string): Promise<IZone>
    GetProxyProperties(): Promise<Record<string, any>>
    subscribe_ConnectionChanged(): Observable<EventDto<{ isConnected: boolean }>>
}

interface IZone {
    GetProxyProperties(): Promise<ZoneProp>
    IsLoadableAsDestination(position: number, count: number): Promise<boolean>
    Tracking_GetById(): Promise<Tracking>
    subscribe_ZoneChanged(): Observable<EventDto<ZoneChangedEventArgs>>
}

class ZoneProp {
    Code!: string
    Tracking!: Tracking[]
}

class Tracking {
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

class ZoneChangedEventArgs {
    Tracking!: Tracking[];
    TimeStamp!: string;
}


function ConvertResponse<T>(methodName: string, result: T) {
    switch (methodName) {
        case "Tracking_GetById": return plainToInstance(Tracking, result)
    }
    return result
}

const connection = new ProxyWebsocket(url)

connection.IsConnected.subscribe(async (connected) => {
    console.log({ connected })

    if (connected) {

        try {

            const manager = await createProxy<ITrackingManager>(connection, proxyMethods, "Tenaris.Manager.Tracking.TrackingManager.Proxy", null, [], undefined);
            console.log({ manager })



            // var managerProps = await manager.GetProxyProperties()
            // console.log({ TrackingAttributes: managerProps["TrackingAttributes"] })

            manager.subscribe_ConnectionChanged().subscribe(e => {
                console.log("Event MANAGER ConnectionChanged", { isConnected: e.EventData.isConnected })
            })

            const zone = await manager.Zones_GetByCode("ENTRADA_SELADORA");
            // console.log({ zone })
            // return;

            // const zone = await manager.Zones_GetByCode("ENTRADA_INSP_PRENS_O");

            manager.subscribe_ConnectionChanged().subscribe(e => {
                console.log("Event ZONE ConnectionChanged", { isConnected: e.EventData.isConnected })

                if (e.EventData.isConnected) {
                    zone.subscribe_ZoneChanged().subscribe(e => {
                        console.log("Event zone changed 2", { TimeStamp: e.EventData.TimeStamp })
                    })
                }
            })

            var zoneProps = await zone.GetProxyProperties();
            console.log("zoneProps:", zoneProps)

            // var tracking = zoneProps.Tracking; 
            // console.log({ zoneCode: zoneProps.Code, tracking: tracking.at(0) })
            // console.log({ Attributes_Batch: tracking.at(0)?.Attributes["Batch"] })

            var isLoadable = await zone.IsLoadableAsDestination(0, 1);
            console.log({ isLoadable })

            var sub = zone.subscribe_ZoneChanged();
            var s = sub.subscribe(e => {
                console.log("Event zone changed", {
                    // zoneCode: zone.Code,
                    time: e.EventData.TimeStamp,
                    tracking_0: e.EventData.Tracking?.at(0)?.TraceabilityCode,
                    tracking_r1: e.EventData.Tracking?.at(-1)?.TraceabilityCode,
                })
            })
        } catch (er) {
            console.error(er)
        }
    }
})



// class B {
//     start!: Date;
//     @Type(() => Date)
//     end!: Date;
// }

// class A {
//     @Type(() => Date)
//     time!: Date;
//     @Type(() => B)
//     items!: B[];
// }


// var arequest = {
//     time: '2026-03-31T15:49:20.5817421-03:00',
//     items: [{
//         start: '2026-03-31T15:49:20.5817421-03:00',
//         end: '2026-03-31T15:49:20.5817421-03:00',
//     }]
// } as any as A

// console.log({ arequest })
// var a2 = plainToInstance(A, arequest)
// console.log({ a2 })
// console.log({ items: a2.items })



export { };
