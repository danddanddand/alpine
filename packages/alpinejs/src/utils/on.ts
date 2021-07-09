
export default function on (el : HTMLElement, event : string, modifiers : string[], callback : (e:Event) => void ) {
    let listenerTarget : Element | Window | Document = el

    let handler = ( e : Event ) => callback(e)

    let options : AddEventListenerOptions = {}

    // This little helper allows us to add functionality to the listener's
    // handler more flexibly in a "middleware" style.
    let wrapHandler = (callback : ( e : Event ) => void, wrapper : ( next : ( e: Event ) => void, e : Event ) => void ) => (e : Event ) => wrapper(callback, e)

    if (modifiers.includes('camel')) event = camelCase(event)
    if (modifiers.includes('passive')) options.passive = true
    if (modifiers.includes('window')) listenerTarget = window
    if (modifiers.includes('document')) listenerTarget = document
    if (modifiers.includes('prevent')) handler = wrapHandler(handler, (next, e) => { e.preventDefault(); next(e) })
    if (modifiers.includes('stop')) handler = wrapHandler(handler, (next, e) => { e.stopPropagation(); next(e) })
    if (modifiers.includes('self')) handler = wrapHandler(handler, (next, e) => { e.target === el && next(e) })

    if (modifiers.includes('away') || modifiers.includes('outside')) {
        listenerTarget = document

        handler = wrapHandler(handler, (next, e) => {
            if (el.contains(e.target as Node)) return

            if (el.offsetWidth < 1 && el.offsetHeight < 1) return

            next(e)
        })
    }

    // Handle :keydown and :keyup listeners.
    handler = wrapHandler(handler, (next, e) => {
        if (isKeyEvent(event)) {
            if (isListeningForASpecificKeyThatHasntBeenPressed(e as KeyboardEvent, modifiers)) {
                return
            }
        }

        next(e)
    })

    if (modifiers.includes('debounce')) {
        let nextModifier = modifiers[modifiers.indexOf('debounce')+1] || 'invalid-wait'
        let wait = isNumeric(nextModifier.split('ms')[0]) ? Number(nextModifier.split('ms')[0]) : 250

        // @ts-ignore
        handler = debounce(handler, wait, this)
    }

    if (modifiers.includes('throttle')) {
        let nextModifier = modifiers[modifiers.indexOf('throttle')+1] || 'invalid-wait'
        let wait = isNumeric(nextModifier.split('ms')[0]) ? Number(nextModifier.split('ms')[0]) : 250

        // @ts-ignore
        handler = throttle(handler, wait, this)
    }

    if (modifiers.includes('once')) {
        handler = wrapHandler(handler, (next, e) => {
            next(e)

            listenerTarget.removeEventListener(event, handler, options)
        })
    }

    listenerTarget.addEventListener(event, handler, options)

    return () => {
        listenerTarget.removeEventListener(event, handler, options)
    }
}

function camelCase(subject : string) {
    return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase())
}


function debounce(func : Function, wait : number, ...args: any[]) {
    var timeout: number | undefined

    return function() {
        // @ts-ignore
        var context = this

        var later = function () {
            timeout = undefined

            func.apply(context, args)
        }

        clearTimeout(timeout)

        timeout = setTimeout(later, wait)
    }
}

function throttle(func : Function, limit : number, ...args: any[] ) {
    let inThrottle : boolean | undefined;

    return function() {
        // @ts-ignore
        let context = this

        if (! inThrottle) {
            func.apply(context, args)

            inThrottle = true

            setTimeout(() => inThrottle = false, limit)
        }
    }
}

function isNumeric(subject : any){
    return ! Array.isArray(subject) && ! isNaN(subject)
}

function kebabCase(subject:string) {
    return subject.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[_\s]/, '-').toLowerCase()
}

function isKeyEvent(event : string) {
    return ['keydown', 'keyup'].includes(event)
}

function isListeningForASpecificKeyThatHasntBeenPressed(e : KeyboardEvent, modifiers : string[] ) {
    let keyModifiers = modifiers.filter(i => {
        return ! ['window', 'document', 'prevent', 'stop', 'once'].includes(i)
    })

    if (keyModifiers.includes('debounce')) {
        let debounceIndex = keyModifiers.indexOf('debounce')
        keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex+1] || 'invalid-wait').split('ms')[0]) ? 2 : 1)
    }

    // If no modifier is specified, we'll call it a press.
    if (keyModifiers.length === 0) return false

    // If one is passed, AND it matches the key pressed, we'll call it a press.
    if (keyModifiers.length === 1 && keyModifiers[0] === keyToModifier(e.key)) return false

    // The user is listening for key combinations.
    const systemKeyModifiers = ['ctrl', 'shift', 'alt', 'meta', 'cmd', 'super']
    const selectedSystemKeyModifiers = systemKeyModifiers.filter(modifier => keyModifiers.includes(modifier))

    keyModifiers = keyModifiers.filter(i => ! selectedSystemKeyModifiers.includes(i))

    if (selectedSystemKeyModifiers.length > 0) {
        const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter(modifier => {
            // Alias "cmd" and "super" to "meta"
            if (modifier === 'cmd' || modifier === 'super') modifier = 'meta'

            // @ts-ignore
            return e[`${modifier}Key`]
        })

        // If all the modifiers selected are pressed, ...
        if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
            // AND the remaining key is pressed as well. It's a press.
            if (keyModifiers[0] === keyToModifier(e.key)) return false
        }
    }

    // We'll call it NOT a valid keypress.
    return true
}

function keyToModifier(key : string) {
    switch (key) {
        case '/':
            return 'slash'
        case ' ':
        case 'Spacebar':
            return 'space'
        default:
            return key && kebabCase(key)
    }
}
