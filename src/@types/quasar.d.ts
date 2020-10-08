import 'quasar'

declare module 'quasar' {
  interface QTableColumn {
    /**
     * Unique id, identifies column, (used by pagination.sortBy, 'body-cell-[name]' slot, ...)
     */
    name: string
    /**
     * Label for header
     */
    label: string
    /**
     * Row Object property to determine value for this column or function which maps to the required property
     */
    field: string | Function
    /**
     * If we use visible-columns, this col will always be visible
     */
    required?: boolean
    /**
     * Horizontal alignment of cells in this column
     */
    align?: string
    /**
     * Tell QTable you want this column sortable
     */
    sortable?: boolean
    /**
     * Compare function if you have some custom data or want a specific way to compare two rows
     */
    sort?: Function
    /**
     * Function you can apply to format your data
     */
    format?: Function
    /**
     * Style to apply on normal cells of the column
     */
    style?: string
    /**
     * Classes to add on normal cells of the column
     */
    classes?: string
    /**
     * Style to apply on header cells of the column
     */
    headerStyle?: string
    /**
     * Classes to add on header cells of the column
     */
    headerClasses?: string
  }
}
