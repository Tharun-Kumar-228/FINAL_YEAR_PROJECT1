/**
 * Normalizes phone numbers to a consistent digit format.
 * Strips non-digit characters and standardizes Indian (+91/91/0) 10-digit numbers.
 * @param {string} phone 
 * @returns {string} Normalized phone number string
 */
function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = String(phone).trim().replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  
  return cleaned;
}

module.exports = { normalizePhone };
