/**
 * Maps the 10th character of a VIN to a 2-digit model year.
 * VINs follow a 30-year cycle for the 10th character.
 * This map focuses on 2001-2030, assuming modern vehicles.
 */
const VIN_MODEL_YEAR_MAP = {
  '1': '01', '2': '02', '3': '03', '4': '04', '5': '05', '6': '06', '7': '07', '8': '08', '9': '09',
  'A': '10', 'B': '11', 'C': '12', 'D': '13', 'E': '14', 'F': '15', 'G': '16', 'H': '17',
  'J': '18', 'K': '19', 'L': '20', 'M': '21', 'N': '22', 'P': '23', 'R': '24', 'S': '25',
  'T': '26', 'V': '27', 'W': '28', 'X': '29', 'Y': '30'
};

/**
 * Decodes the model year from a 17-character VIN string.
 * @param {string} vin - 17 character VIN
 * @returns {string|null} - 2-digit model year or null if not found
 */
export const decodeModelYearFromVin = (vin) => {
  if (!vin || vin.length < 10) return null;
  const yearChar = vin.charAt(9).toUpperCase();
  return VIN_MODEL_YEAR_MAP[yearChar] || null;
};
