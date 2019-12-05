//Deduce a name and units from the remarks key
module.exports = rmrk => {
  const rx = /^struct: (.*)/;
  //Reject if not matching
  if (!rx.test(rmrk)) return {};

  const parenthesisRx = / ?\(.*?\)/g;
  //Remove parenthesis and fix known limitations to get a better result with headers later
  const name = rmrk
    .match(rx)[1]
    .replace(parenthesisRx, '')
    .replace(/\bXYZ\b/, 'X, Y, Z');
  let broadString = rmrk.match(rx)[1];

  //Replace commas inside parenthesis temporarily
  const commasRx = /(\([^)]*?),([^)]*?\))/g;
  while (broadString.match(commasRx))
    broadString = broadString.replace(commasRx, '$1:REPLACER:$2');

  const broad = broadString.split(',');
  const units = [];
  const unitRx = /\((.+)\)/;
  broad.forEach(v => {
    if (!unitRx.test(v)) units.push('');
    else {
      units.push(...v.match(unitRx)[1].split(':REPLACER:'));
    }
  });

  return { name, units };
};
