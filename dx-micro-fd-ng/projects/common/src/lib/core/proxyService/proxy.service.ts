
interface IManager {
    Code: string
    __ObjectId: number,
    getMachine(id: number): Promise<IMachine>
    getName(): Promise<string>
    onDataChanged(callBack: ((id: number) => void)): void
}

interface IMachine {
    getData(id: number): Promise<string>;
    getStation(id: number): Promise<IStation>
}

interface IStation {
    getData(id: number): Promise<string>;
}

const FACTORY_METHODS = ['getMachine', 'getStation'];


interface IQueryResolver {
    post<T>(parent: PContext | null, method: string, args: any[]): Promise<T>
    suscribe<T>(parent: PContext | null, method: string): Promise<void>
}

class DemoResolver implements IQueryResolver {

    post<T>(parent: PContext | null, method: string, args: any[]): Promise<T> {

        if (method == "IManager.Proxy")
            return Promise.resolve({
                Methods: ["getMachine"],
                Events: ["onDataChanged"],
                Props: { "Code": "Codigo x" }
            } as T)

        return Promise.resolve(args as T)
    }

    suscribe<T>(parent: PContext | null, method: string) {
        return Promise.resolve()
    }
}

type PContextData = {
    Props: Record<string, any>
    Methods: string[]
    Events: string[]
}

type PContext = {
    initMethod: string;
    initArgs: any[];
    parents: any[];
    methods: any[];
    data: PContextData;
}

async function createProxy<T extends object>(
    queryResolver: IQueryResolver,
    initMethod: string,
    initArgs: any[],
    parent: PContext | null = null): Promise<T> {
    console.debug('create proxy', { initMethod, initArgs });

    return queryResolver.post<PContextData>(parent, initMethod, initArgs)
        .then(data => {
            let context: PContext = {
                initMethod,
                initArgs,
                parents: [...parent?.parents ?? [], parent],
                methods: [...parent?.methods ?? [], initMethod],
                data: {
                    Props: data?.Props ?? {},
                    Methods: data.Methods ?? [],
                    Events: data.Events ?? [],
                },
            }

            return new Proxy({ context } as T, {
                get(_, prop) {

                    if (typeof prop === 'symbol') return undefined;
                    if (['then', 'catch', 'finally'].includes(prop)) return undefined;

                    console.debug({ prop, events: context.data.Events })

                    if (prop in context.data.Props) return context.data.Props[prop];
                    if (context.data.Events.includes(prop)) {
                        queryResolver.suscribe(context, prop);
                        return () => undefined;
                    }

                    return (...args: any[]) => {
                        console.debug(`*** Invocando en  ${context.methods} ${prop}(${args})`);

                        if (FACTORY_METHODS.includes(prop)) {
                            return createProxy(queryResolver, prop, args, context);
                        }

                        // fetch
                        // console.debug(`Ejecutando llamada final: ${prop}`);
                        return queryResolver.post(context, prop, args);
                    };
                }
            });
        })

};


const demoResolver = new DemoResolver()
const service = await createProxy<IManager>(demoResolver, "IManager.Proxy", []);
console.log({ service })
console.log({ code: service.Code })
const machine = await service.getMachine(1);
console.log({ machine })
var station = await machine.getStation(2);
console.log({ station })
var data = await station.getData(3);
console.log({ data })

service.onDataChanged((a) => { console.log("On data changed") });

export { };
