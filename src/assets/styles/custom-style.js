import '@polymer/polymer/polymer-legacy.js';

const $_documentContainer = document.createElement('template');
$_documentContainer.setAttribute('style', 'display: none;');

$_documentContainer.innerHTML = `
<custom-style>
  <style is="custom-style">

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
          border-right: 1px solid var(--app-default-border-color);
        }
      }
    }

  </style>
</custom-style>
`;

document.head.appendChild($_documentContainer.content);
