const atob = require('atob');

const readInt64BEasFloat = (buffer, offset) => {
  const low = buffer.readInt32BE(offset + 4);
  let n = buffer.readInt32BE(offset) * 4294967296.0 + low;
  if (low < 0) n += 4294967296;
  return n;
};

// Try to find timing data quickly as last resort for sorting files
module.exports = (data, forceGPSSrc) => {
  let GPSU;
  let GPS9Time;
  let STMP;

  const checkGPS9 = forceGPSSrc !== 'GPS5';
  const checkGPS5 = forceGPSSrc !== 'GPS9';

  // loop for an arbitrarily short amount of times, otherwise give up search
  for (let i = 0; i < 100000 && i + 4 < (data || []).length; i += 4) {
    //Find potential fourCCs, letter by letter to discard quicker
    if (
      checkGPS5 &&
      'G' === atob(data.slice(i + 0, i + 1)) &&
      'P' === atob(data.slice(i + 1, i + 2)) &&
      'S' === atob(data.slice(i + 2, i + 3)) &&
      'U' === atob(data.slice(i + 3, i + 4))
    ) {
      const sizeIdx = i + 5;
      const repeatIdx = i + 6;
      const valIdx = i + 8;
      const size = data.slice(sizeIdx, sizeIdx + 1).readUInt8();
      const repeat = data.slice(repeatIdx, repeatIdx + 2).readUInt16BE();
      const value = data.slice(valIdx, valIdx + size * repeat);
      GPSU = +atob(value);
    } else if (
      checkGPS9 &&
      'G' === atob(data.slice(i + 0, i + 1)) &&
      'P' === atob(data.slice(i + 1, i + 2)) &&
      'S' === atob(data.slice(i + 2, i + 3)) &&
      '9' === atob(data.slice(i + 3, i + 4))
    ) {
      const valIdx = i + 8;
      const daysValue = data.slice(valIdx + 20, valIdx + 24);
      const secondsValue = data.slice(valIdx + 24, valIdx + 28);
      const days = daysValue.readInt32BE();
      const seconds = secondsValue.readInt32BE() / 1000;
      GPS9Time = seconds + days * 86400;
    } else if (
      'S' === atob(data.slice(i + 0, i + 1)) &&
      'T' === atob(data.slice(i + 1, i + 2)) &&
      'M' === atob(data.slice(i + 2, i + 3)) &&
      'P' === atob(data.slice(i + 3, i + 4))
    ) {
      STMP = readInt64BEasFloat(data, i + 8);
    }
    if (
      (GPS9Time != null || !checkGPS9) &&
      (GPSU != null || !checkGPS5) &&
      STMP != null
    )
      break;
  }
  return { GPSU, STMP, GPS9Time };
};
