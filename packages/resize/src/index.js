export default function (Alpine) {
    Alpine.directive('resize', Alpine.skipDuringClone((el, { value, expression, modifiers }, { evaluateLater, cleanup }) => {
        let evaluator = evaluateLater(expression)

        let evaluate = (width, height) => {
            evaluator(() => {}, { scope: { '$width': width, '$height': height }})
        }

        let off = modifiers.includes('document')
            ? onDocumentResize(evaluate)
            : onElResize(el, evaluate)

        cleanup(() => off())
    }))
}

function onElResize(el, callback) {
    let observer = new ResizeObserver((entries) => {
        let [width, height] = dimensions(entries)

        callback(width, height)
    })

    observer.observe(el)

    return () => observer.disconnect()
}

let documentResizeObserver
let documentResizeObserverCallbacks = new Set
let documentResizeObserverDimensions

function onDocumentResize(callback) {
    documentResizeObserverCallbacks.add(callback)

    if (! documentResizeObserver) {
        documentResizeObserver = new ResizeObserver((entries) => {
            let [width, height] = dimensions(entries)

            documentResizeObserverDimensions = [width, height]

            documentResizeObserverCallbacks.forEach(i => i(width, height))
        })

        documentResizeObserver.observe(document.documentElement)
    } else if (documentResizeObserverDimensions) {
        // The observer only reports when a resize happens, so subscribers
        // added after the first would otherwise wait for the next real
        // resize before receiving any dimensions...
        callback(...documentResizeObserverDimensions)
    }

    return () => {
        documentResizeObserverCallbacks.delete(callback)

        if (documentResizeObserverCallbacks.size === 0) {
            documentResizeObserver.disconnect()
            documentResizeObserver = undefined
            documentResizeObserverDimensions = undefined
        }
    }
}

function dimensions(entries) {
    let width, height

    for (let entry of entries) {
        width = entry.borderBoxSize[0].inlineSize
        height = entry.borderBoxSize[0].blockSize
    }

    return [width, height]
}
