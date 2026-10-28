// Phone numbers in this codebase are stored as free-form strings
// (e.g. "+91-9876543001"). Staff may type the same number as
// "9876543001", "+91 98765 43001", etc. These helpers keep lookups
// predictable without introducing a second phone column.

const cleanPhone = (value) => String(value ?? '').trim();

const phoneDigits = (value) => cleanPhone(value).replace(/\D/g, '');

const isValidPhone = (value) => {
  const digits = phoneDigits(value);
  return digits.length >= 10 && digits.length <= 15;
};

const phoneVariants = (value) => {
  const raw = cleanPhone(value);
  const digits = phoneDigits(raw);
  const last10 = digits.slice(-10);
  const variants = new Set();

  if (raw) variants.add(raw);
  if (digits) {
    variants.add(digits);
    variants.add(`+${digits}`);
  }

  if (last10.length === 10) {
    variants.add(last10);
    variants.add(`91${last10}`);
    variants.add(`+91${last10}`);
    variants.add(`+91-${last10}`);
    variants.add(`+91 ${last10}`);
  }

  return [...variants].filter(Boolean);
};

module.exports = {
  cleanPhone,
  phoneDigits,
  isValidPhone,
  phoneVariants,
};
