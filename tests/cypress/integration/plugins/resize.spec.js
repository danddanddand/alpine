import { haveText, test, html, notHaveText } from '../../utils'

test('can react to the resizing of an element',
    [html`
    <div x-data="{ width: 0, height: 0 }">
        <h1 x-text="width"></h1>
        <h2 x-text="height"></h2>

        <div x-ref="target" x-resize="width = $width; height = $height" style="width: 100px; height: 100px; background: red">
        </div>

        <button id="1" x-on:click="$refs.target.style.width = 50 + 'px'">resize width</button>
        <button id="2" x-on:click="$refs.target.style.height = 50 + 'px'">resize height</button>
    </div>
    `],
    ({ get }) => {
        get('h1').should(haveText('100'))
        get('h2').should(haveText('100'))
        get('button#1').click()
        get('h1').should(haveText('50'))
        get('h2').should(haveText('100'))
        get('button#2').click()
        get('h1').should(haveText('50'))
        get('h2').should(haveText('50'))
    },
)

test('can react to the resizing of the document',
    [html`
    <div x-data="{ width: 0, height: 0 }">
        <h1 x-text="width"></h1>
        <h2 x-text="height"></h2>

        <div x-ref="target" x-resize.document="width = $width; height = $height" style="width: 100px; height: 100px; background: red">
    </div>
    `],
    ({ get }) => {
        get('h1').should(notHaveText('0'))
        get('h2').should(notHaveText('0'))
        get('h1').should(notHaveText('100'))
        get('h2').should(notHaveText('100'))

        cy.viewport(550, 750)

        get('h1').should(haveText('550'))
        get('h2').should(haveText('750'))
    },
)

test('document resize subscribers added after the first receive current dimensions',
    [html`
    <div x-data="{ show: false, width1: 0, width2: 0 }">
        <h1 x-text="width1"></h1>
        <h2 x-text="width2"></h2>

        <button @click="show = true">Show</button>

        <div x-resize.document="width1 = $width"></div>

        <template x-if="show">
            <div x-resize.document="width2 = $width"></div>
        </template>
    </div>
    `],
    ({ get }) => {
        get('h1').should(notHaveText('0'))
        get('h2').should(haveText('0'))
        get('button').click()
        get('h2').should(notHaveText('0'))
    },
)

test('document resize keeps working after all subscribers have been removed',
    [html`
    <div x-data="{ show: true, width: 0 }">
        <h1 x-text="width"></h1>

        <button @click="width = 0; show = ! show">Toggle</button>

        <template x-if="show">
            <div x-resize.document="width = $width"></div>
        </template>
    </div>
    `],
    ({ get }) => {
        get('h1').should(notHaveText('0'))

        get('button').click()
        get('h1').should(haveText('0'))

        get('button').click()
        get('h1').should(notHaveText('0'))

        cy.viewport(550, 750)
        get('h1').should(haveText('550'))
    },
)
