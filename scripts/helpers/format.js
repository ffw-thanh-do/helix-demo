// eslint-disable-next-line
export function arrToParts(arr, num) {
  const result = [];
  for (let i = 0; i < arr.length; i += num) {
    result.push(arr.slice(i, i + num));
  }
  return result;
}

/**
 * Extracts the config from a row.
 * @param {Element} row The row element
 * @returns {object} The row config
 */
export function getConfigsByRow(row) {
  const configs = {};
  const p = row.querySelectorAll('p');
  for (let i = 0; i < p.length; i += 1) {
    const config = p[i].innerHTML.trim().split(':');
    Object.defineProperty(configs, config[0], {
      value: config[1],
      writable: true,
    });
  }
  return configs;
}
