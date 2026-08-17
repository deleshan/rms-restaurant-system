// Base units: mass → grams (g), volume → millilitres (ml), count → piece
// Every inventory item's `unit` and every recipe ingredient's `unit` must
// map to one of these keys (or be added here if introduce new units).
const UNIT_TO_BASE = {
  // mass
  g:  1,
  kg: 1000,
  mg: 0.001,

  // volume
  ml: 1,
  l:  1000,

  // count
  piece: 1,
  pcs:   1,
  unit:  1,
};

const UNIT_ALIASES = {
  gram: 'g', grams: 'g',
  kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg',
  milligram: 'mg', milligrams: 'mg',
  millilitre: 'ml', milliliter: 'ml', millilitres: 'ml', milliliters: 'ml',
  litre: 'l', liter: 'l', litres: 'l', liters: 'l',
  pieces: 'piece', units: 'unit', pc: 'piece',
};

const UNIT_FAMILY = {
  g: 'mass', kg: 'mass', mg: 'mass',
  ml: 'volume', l: 'volume',
  piece: 'count', pcs: 'count', unit: 'count',
};

function normalizeUnit(unit) {
  const lower = (unit || 'g').toLowerCase().trim();
  return UNIT_ALIASES[lower] || lower;
}

/**
 * Converts a quantity from one unit to another.
 * Throws if the two units aren't in the same family (e.g. g -> ml),
 * since that's almost certainly a data-entry error, not a valid conversion.
 */
function convertQuantity(quantity, fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit);
  const to   = normalizeUnit(toUnit);

  if (from === to) return quantity;

  const fromFactor = UNIT_TO_BASE[from];
  const toFactor   = UNIT_TO_BASE[to];

  if (fromFactor === undefined || toFactor === undefined) {
    throw new Error(`Unknown unit in conversion: "${fromUnit}" -> "${toUnit}"`);
  }

  if (UNIT_FAMILY[from] !== UNIT_FAMILY[to]) {
    throw new Error(
      `Cannot convert between incompatible unit families: "${fromUnit}" (${UNIT_FAMILY[from]}) ` +
      `-> "${toUnit}" (${UNIT_FAMILY[to]})`
    );
  }

  const baseQuantity = quantity * fromFactor;
  return baseQuantity / toFactor;
}

/**
 * Converts a price-per-unit figure from one unit to another.
 * E.g. Rs. 460 per kg -> Rs. 0.46 per g.
 * This is the inverse relationship of convertQuantity: price per a
 * *smaller* unit is *smaller*, not larger.
 */
function convertPricePerUnit(price, fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (from === to) return price;

  // How many `to` units are in 1 `from` unit (e.g. how many g in 1 kg = 1000)
  const unitsPerFrom = convertQuantity(1, from, to);

  // Price per 1 `to` unit = price per `from` unit / how many `to` units fit in it
  return price / unitsPerFrom;
}

module.exports = { convertQuantity, convertPricePerUnit, UNIT_TO_BASE, UNIT_FAMILY };