
export function scope(node : Node) {
    return mergeProxies(closestDataStack(node))
}

type NodeWithDataStack = Node & { _x_dataStack : any[] };

export function addScopeToNode(node : NodeWithDataStack, data : any, referenceNode : Element) {
    node._x_dataStack = [data, ...closestDataStack(referenceNode || node)]

    return () => {
        node._x_dataStack = node._x_dataStack.filter(i => i !== data)
    }
}

export function hasScope(node : NodeWithDataStack) {
    return !! node._x_dataStack
}

export function refreshScope(element : NodeWithDataStack, scope) {
    let existingScope = element._x_dataStack[0]

    Object.entries(scope).forEach(([key, value]) => {
        existingScope[key] = value
    })
}

export function closestDataStack(node : Node & { _x_dataStack? : any[]} | ShadowRoot & { _x_dataStack? : any[]}) : any[] {
    if (node._x_dataStack) return node._x_dataStack

    if (node instanceof ShadowRoot) {
        return closestDataStack(node.host as unknown as ShadowRoot)
    }

    if (! node.parentNode) {
        return []
    }

    return closestDataStack(node.parentNode)
}

export function closestDataProxy(el : Node) {
    return mergeProxies(closestDataStack(el))
}

export function mergeProxies<T extends Object>(objects: T[] ) {
    return new Proxy({}, {
        ownKeys: () => {
            return Array.from(new Set(objects.flatMap(i => Object.keys(i))))
        },

        has: (target, name) => {
            return objects.some(obj => obj.hasOwnProperty(name))
        },

        get: (target, name) => {
            // @ts-ignore
            return (objects.find(obj => obj.hasOwnProperty(name)) || {})[name]
        },

        set: (target, name, value) => {
            let closestObjectWithKey = objects.find(obj => obj.hasOwnProperty(name))

            if (closestObjectWithKey) {
                // @ts-ignore
                closestObjectWithKey[name] = value
            } else {
                // @ts-ignore
                objects[objects.length - 1][name] = value
            }

            return true
        },
    })
}
