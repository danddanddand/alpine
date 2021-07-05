
import { scheduler } from './scheduler'
import {ReactiveEffect, ReactiveEffectOptions, UnwrapNestedRefs} from "@vue/reactivity";


let reactive : AlpineReactiveFunction, effect : AlpineEffectFunction, release : AlpineReleaseFunction, raw : AlpineReleaseFunction

let shouldSchedule = true
export function disableEffectScheduling(callback :() => ReactiveEffect) {
    shouldSchedule = false

    callback()

    shouldSchedule = true
}

type AlpineReactiveFunction = <T extends object>(target: T) => UnwrapNestedRefs<T>
type AlpineReleaseFunction = (effect: ReactiveEffect) => void
type AlpineRawFunction = <T>(observed: T) => T
type AlpineEffectFunction = <T = any>(fn: () => T, options?: ReactiveEffectOptions) => ReactiveEffect<T>
type AlpineCleanupFunction = () => void;
type AlpineEffectTuple = [unknown, AlpineCleanupFunction];

interface ReactivityEngine {
    reactive : AlpineReactiveFunction // reactive in vue
    release : AlpineReleaseFunction // stop in vue
    raw : AlpineRawFunction
    effect : AlpineEffectFunction
}

export function setReactivityEngine(engine : ReactivityEngine ) {
    reactive = engine.reactive
    release = engine.release
    effect = <T = any>(callback: () => T) => engine.effect(callback, { scheduler: task => {
        if (shouldSchedule) {
            scheduler(task)
        } else {
            task()
        }
    } })
    raw = engine.raw
}

export function overrideEffect(override :AlpineEffectFunction) { effect = override }

export function elementBoundEffect(el : Element & { _x_effects?:Set<Function>, _x_runEffects?:()=>void}) : AlpineEffectTuple {
    let cleanup = () => {}

    let wrappedEffect = (callback :() => ReactiveEffect) => {
        let effectReference = effect(callback)

        if (! el._x_effects) {
            el._x_effects = new Set<Function>()

            // Livewire depends on el._x_runEffects.
            el._x_runEffects = () => { el._x_effects!.forEach(i => i()) }
        }

        el._x_effects.add(effectReference)

        cleanup = () => {
            if (effectReference === undefined) return

            el._x_effects!.delete(effectReference)

            release(effectReference)
        }
    }

    return [wrappedEffect, () => { cleanup() }]
}

export {
    release,
    reactive,
    effect,
    raw,
}
