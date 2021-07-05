import { reactive } from "./reactivity"

let stores = Object.create(null)
let isReactive = false

interface AlpineMandatoryProps extends Object {
    init?: () => void,
}

export function store<T extends AlpineMandatoryProps>(name : string , value ? : T) {
    if (! isReactive) { stores = reactive(stores); isReactive = true; }

    if (value === undefined) {
        return stores[name]
    }

    stores[name] = value

    if (typeof value === 'object' && value !== null && value.hasOwnProperty('init') && typeof value.init === 'function') {
        stores[name].init()
    }
}

export function getStores() { return stores }
