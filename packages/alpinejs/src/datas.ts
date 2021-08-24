
let datas = Object.create(null)

export function data(name : string, callback : Function) {
    datas[name] = callback
}

export function injectDataProviders(obj, context) {
    Object.entries(datas).forEach(([name, callback]) => {
        Object.defineProperty(obj, name, {
            get() {
                return (...args) => {
                    return callback.bind(context)(...args)
                }
            },

            enumerable: false,
        })
    })

    return obj
}
