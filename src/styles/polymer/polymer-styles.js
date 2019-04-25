import '@polymer/polymer/polymer-legacy.js'
import {html} from '@polymer/polymer/lib/utils/html-tag.js'

const template = html`
  <custom-style>
    <style is="custom-style">
      app-drawer {
        --app-drawer-content-container: {
          background-color: var(--comm-grey-100);
        }
      }

      @media (min-width: 600px) {
        app-drawer {
          --app-drawer-content-container: {
            background-color: var(--comm-grey-100);
            border-right: 1px solid var(--comm-grey-300);
          }
        }
      }
    </style>
  </custom-style>
`
template.setAttribute('style', 'display: none;')
document.head.appendChild(template.content)
