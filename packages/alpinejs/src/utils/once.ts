
export function once(callback : Function, fallback : Function = () => {} ) {
    let called = false

    return function () {
        if (! called) {
            called = true

            // @ts-ignore
            callback.apply(this, arguments)
        } else {
            // @ts-ignore
            fallback.apply(this, arguments)
        }
    }
}
