const crypto = require('crypto');
const { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } = require("date-fns");
const { toZonedTime, fromZonedTime } = require("date-fns-tz");

const algorithm = 'aes-256-cbc';
const encryptionKey = process.env.ENCRYPTION_KEY;
const ivLength = 16;

const encryptionKeyDecoded = Buffer.from(encryptionKey, 'base64');
if (encryptionKeyDecoded.length !== 32) {
  throw new Error(`Invalid key length: ${encryptionKeyDecoded.length} bytes. Expected 32 bytes for AES-256.`);
}

const buildMongoDbSort = (sort, allowedSortFields) => {
  if (!sort) {
    return null;
  }

  const sortObject = {};
  sort.split(',').forEach(pair => {
    const [key, value] = pair.split(':');
    const order = value.trim().toLowerCase();
    const camelCaseKey = key.trim().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    if (camelCaseKey && allowedSortFields.includes(key) && (order === 'asc' || order === 'desc')) {
      sortObject[camelCaseKey] = order === 'asc' ? 1 : -1;
    }
  });

  return sortObject;  
};

const encryptSecret = (secret) => {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKeyDecoded, 'utf-8'), iv);
  let encrypted = cipher.update(secret, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return { encryptedSecret: encrypted, iv: iv.toString('hex') };
};

const decryptSecret = (encryptedSecret, iv) => {
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKeyDecoded, 'utf-8'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedSecret, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
};

const generateRandomCode = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const generateSecret = (length = 8) => {
  return crypto.randomBytes(length).toString('hex');
};

const getMidnightUTC = (date = new Date()) => {
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getTomorrowsUTCDate = () => {
  const today = new Date();
  today.setUTCDate(today.getUTCDate() + 1);
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

const getMonthStartEndDatesInTZ = (year, month, timezone) => {
  const { startDate: startDateUTC, endDate: endDateUTC } = getMonthStartEndDatesUTC(year, month);
  return {
      startDate: toZonedTime(startDateUTC, timezone),
      endDate: toZonedTime(endDateUTC, timezone),
  };
};

const getMonthStartEndDatesUTC = (year, month) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  return { startDate, endDate };
};

const getTodayStartEndDatesInTZ = (timezone) => {
  const now = new Date();
  const localStart = startOfDay(now);
  const localEnd = endOfDay(now);

  return {
    start: fromZonedTime(localStart, timezone),
    end: fromZonedTime(localEnd, timezone),
  };
};

const getTomorrowStartEndDatesInTZ = (timezone) => {
  const now = new Date();
  const localStart = startOfDay(addDays(now, 1));
  const localEnd = endOfDay(addDays(now, 1));

  return {
    start: fromZonedTime(localStart, timezone),
    end: fromZonedTime(localEnd, timezone),
  };
};

const getCurrentWeekStartEndDatesInTZ = (timezone) => {
  const now = new Date();

  const zonedNow = fromZonedTime(now, timezone);

  const startLocal = startOfWeek(zonedNow, { weekStartsOn: 1 });
  const endLocal = endOfWeek(zonedNow, { weekStartsOn: 1 });

  console.log(`Current week start: ${startLocal}, end: ${endLocal}`);

  const startUTC = fromZonedTime(startLocal, timezone);
  const endUTC = fromZonedTime(endLocal, timezone);

  return {
    start: startUTC,
    end: endUTC,
  };
};

const isTimezoneValid = (timezone) => {
  const validTimezones = Intl.supportedValuesOf("timeZone");
  return validTimezones.includes(timezone);
};

const getIpAddress = (req) => {  
  const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || "").split(",")[0].trim();
  const ipv4Address = ipAddress.startsWith("::ffff:") ? ipAddress.substring(7) : ipAddress;
  return ipv4Address;
};  

const truncateAddress = (address, visibleStart = 4, visibleEnd = 4) => {
  if (!address) return '';
  return `${address.slice(0, visibleStart)}...${address.slice(-visibleEnd)}`;
};

const buildBlockchainTxExplorerLink = (network, signature) => {
  switch (network) {
    case 'solana':
      const cluster = process.env.SOLANA_CHAIN_ID;
      return `https://solscan.io/tx/${signature}?cluster=${cluster}`;
  }
  return '';
};

module.exports = {
  buildMongoDbSort,
  encryptSecret,
  decryptSecret,
  generateRandomCode,
  generateSecret,
  getMidnightUTC,
  getTomorrowsUTCDate,
  getMonthStartEndDatesInTZ,
  getMonthStartEndDatesUTC,
  isTimezoneValid,
  getTodayStartEndDatesInTZ,
  getTomorrowStartEndDatesInTZ,
  getCurrentWeekStartEndDatesInTZ,
  getIpAddress,
  truncateAddress,
  buildBlockchainTxExplorerLink,
}