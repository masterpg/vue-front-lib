import '@polymer/polymer/polymer-legacy.js';
import '@polymer/paper-styles/color';
import '@polymer/paper-styles/typography';

import './flex-layout';
import './spacing';

const $_documentContainer = document.createElement('template');
$_documentContainer.setAttribute('style', 'display: none;');

$_documentContainer.innerHTML = `
<custom-style>
  <style is="custom-style">

    /*-------------------------------------------------
      Variables
    -------------------------------------------------*/

    html {
      /**
       * Application theme
       */

      --primary-text-color: var(--paper-grey-900);
      --secondary-text-color: var(--paper-grey-600);
      --disabled-text-color: var(--paper-grey-400);
      --accent-text-color: var(--paper-pink-a200);
      --link-color: var(--paper-blue-800);
      --link-visited-color: var(--paper-indigo-300);
      --default-border-color: var(--paper-grey-300);

      /**
       * Grid
       */
      
      --grid-breakpoints-xs: 0;
      --grid-breakpoints-sm: 600px;
      --grid-breakpoints-md: 960px;
      --grid-breakpoints-lg: calc(1280px - 16px); /* Desktop gets a 16dp reduction */
      --grid-breakpoints-xl: calc(1920px - 16px); /* https://material.io/guidelines/layout/responsive-ui.html#responsive-ui-breakpoints */

      /**
       * Components
       */

      /* paper-drawer-panel */
      --drawer-menu-color: #ffffff;
      --drawer-border-color: 1px solid var(--default-border-color);
      --drawer-toolbar-border-color: 1px solid var(--default-border-color);

      /* paper-menu */
      --paper-menu-background-color: #ffffff;
      --menu-link-color: var(--primary-text-color);
      
      /* greet-message */
      --greet-message-color: var(--paper-red-500);
    }

    /*-------------------------------------------------
      Default style
    -------------------------------------------------*/

    body {
      margin: 0;
      font-family: 'Roboto', 'Noto', sans-serif;
      background-color: #ffffff;
      color: var(--primary-text-color);
    }

    /*-------------------------------------------------
      Components
    -------------------------------------------------*/

    app-drawer {
      --app-drawer-content-container: {
        background-color: var(--google-grey-100);
      }
    }

    @media (min-width: 600px) {
      app-drawer {
        --app-drawer-content-container: {
          background-color: var(--google-grey-100);
          border-right: 1px solid var(--default-border-color);
        }
      }
    }

  </style>
</custom-style>
`;

document.head.appendChild($_documentContainer.content);
