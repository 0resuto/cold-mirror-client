/**
 * @typedef {Object} WidgetDimensions
 * @property {number} defaultWidth
 * @property {number} defaultHeight
 * @property {number} minWidth
 * @property {number} minHeight
 */

/**
 * @typedef {Object} WidgetOptions
 * @property {string} id - Unique identifier (e.g., 'standings')
 * @property {string} name - Display name (e.g., 'Standings')
 * @property {string} [description] - Description for the UI
 * @property {WidgetDimensions} dimensions - Window dimensions
 * @property {Object} defaultSettings - Default configuration (columns, clickThrough, etc)
 */

export class WidgetDefinition {
  /**
   * @param {WidgetOptions} options 
   */
  constructor(options) {
    if (!options.id || typeof options.id !== 'string') throw new TypeError('WidgetDefinition requires a valid string "id".');
    if (!options.name) throw new TypeError(`Widget ${options.id} requires a "name".`);
    if (!options.dimensions) throw new TypeError(`Widget ${options.id} requires "dimensions".`);
    if (typeof options.dimensions.defaultWidth !== 'number' || typeof options.dimensions.defaultHeight !== 'number') {
      throw new TypeError(`Widget ${options.id} requires numeric defaultWidth and defaultHeight.`);
    }

    this.id = options.id;
    this.name = options.name;
    this.description = options.description || '';
    this.dimensions = {
      defaultWidth: options.dimensions.defaultWidth,
      defaultHeight: options.dimensions.defaultHeight,
      minWidth: options.dimensions.minWidth || 150,
      minHeight: options.dimensions.minHeight || 150,
    };
    this.defaultSettings = options.defaultSettings || {};

    // Prevent accidental mutations
    Object.freeze(this.dimensions);
    Object.freeze(this.defaultSettings);
    Object.freeze(this);
  }
}
