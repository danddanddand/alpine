
export function setStyles(el : HTMLElement, value : string | Record<string, any>) {
    if (typeof value === 'object' && value !== null) {
        return setStylesFromObject(el, value)
    }

    return setStylesFromString(el, value)
}

function setStylesFromObject(el : HTMLElement, value : Record<string, any>) {
    let previousStyles = Object.create(null);

    Object.entries(value).forEach(([key, value]) => {
        previousStyles[key] = el.style.getPropertyValue(key)

        el.style.setProperty(key, value)
    })

    setTimeout(() => {
        if (el.style.length === 0) {
            el.removeAttribute('style')
        }
    })

    return () => {
        setStyles(el, previousStyles)
    }
}

function setStylesFromString(el : HTMLElement, value : string) {
    let cache = el.getAttribute('style' )

    el.setAttribute('style', value)

    return () => {
        el.setAttribute('style', cache !== null ? cache : '' )
    }
}
