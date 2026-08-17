export class WidgetRegistry {
  constructor() {
    /** @type {Map<string, import('./WidgetDefinition').WidgetDefinition>} */
    this.widgets = new Map();
  }

  /**
   * Registers a new widget definition.
   * @param {import('./WidgetDefinition').WidgetDefinition} widgetDef 
   */
  register(widgetDef) {
    if (this.widgets.has(widgetDef.id)) {
      throw new Error(`Widget with ID ${widgetDef.id} is already registered.`);
    }
    this.widgets.set(widgetDef.id, widgetDef);
  }

  /**
   * Retrieves a widget definition by its ID.
   * @param {string} id 
   * @returns {import('./WidgetDefinition').WidgetDefinition | undefined}
   */
  get(id) {
    return this.widgets.get(id);
  }

  /**
   * Retrieves all registered widget definitions.
   * @returns {import('./WidgetDefinition').WidgetDefinition[]}
   */
  getAll() {
    return Array.from(this.widgets.values());
  }
}
