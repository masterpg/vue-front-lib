import { Quasar } from 'quasar'
import Vue from 'vue'

export namespace quasar {
  export function setup() {
    Vue.use(Quasar, {
      components: {
        QAvatar: require('quasar').QAvatar,
        QBar: require('quasar').QBar,
        QBreadcrumbs: require('quasar').QBreadcrumbs,
        QBreadcrumbsEl: require('quasar').QBreadcrumbsEl,
        QBtn: require('quasar').QBtn,
        QBtnDropdown: require('quasar').QBtnDropdown,
        QBtnGroup: require('quasar').QBtnGroup,
        QBtnToggle: require('quasar').QBtnToggle,
        QCard: require('quasar').QCard,
        QCardActions: require('quasar').QCardActions,
        QCardSection: require('quasar').QCardSection,
        QCheckbox: require('quasar').QCheckbox,
        QDialog: require('quasar').QDialog,
        QDrawer: require('quasar').QDrawer,
        QExpansionItem: require('quasar').QExpansionItem,
        QForm: require('quasar').QForm,
        QHeader: require('quasar').QHeader,
        QIcon: require('quasar').QIcon,
        QImg: require('quasar').QImg,
        QInnerLoading: require('quasar').QInnerLoading,
        QInput: require('quasar').QInput,
        QItem: require('quasar').QItem,
        QItemLabel: require('quasar').QItemLabel,
        QItemSection: require('quasar').QItemSection,
        QLayout: require('quasar').QLayout,
        QLinearProgress: require('quasar').QLinearProgress,
        QList: require('quasar').QList,
        QMenu: require('quasar').QMenu,
        QPage: require('quasar').QPage,
        QPageContainer: require('quasar').QPageContainer,
        QResizeObserver: require('quasar').QResizeObserver,
        QRouteTab: require('quasar').QRouteTab,
        QScrollArea: require('quasar').QScrollArea,
        QSeparator: require('quasar').QSeparator,
        QSpace: require('quasar').QSpace,
        QSpinner: require('quasar').QSpinner,
        QSplitter: require('quasar').QSplitter,
        QTab: require('quasar').QTab,
        QTable: require('quasar').QTable,
        QTabs: require('quasar').QTabs,
        QTd: require('quasar').QTd,
        QTh: require('quasar').QTh,
        QToolbar: require('quasar').QToolbar,
        QToolbarTitle: require('quasar').QToolbarTitle,
        QTooltip: require('quasar').QTooltip,
        QTr: require('quasar').QTr,
      },
      config: {
        notify: {},
        loading: {},
        screen: {
          bodyClasses: true,
        },
      },
      directives: {
        ClosePopup: require('quasar').ClosePopup,
        Ripple: require('quasar').Ripple,
      },
      plugins: {
        Dialog: require('quasar').Dialog,
        Loading: require('quasar').Loading,
        Notify: require('quasar').Notify,
      },
    })
  }

  export function setupExtras() {
    require('@quasar/extras/roboto-font/roboto-font.css')
    require('@quasar/extras/material-icons/material-icons.css')
    require('@quasar/extras/material-icons-outlined/material-icons-outlined.css')
    require('@quasar/extras/material-icons-round/material-icons-round.css')
    require('@quasar/extras/material-icons-sharp/material-icons-sharp.css')
    require('@quasar/extras/fontawesome-v5/fontawesome-v5.css')
  }
}
