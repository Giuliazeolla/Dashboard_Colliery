export function dmsToDecimal(dmsStr) {
  const regex = /(\d+)°(\d+)'(\d+)"?([NSEW])/g;
  let lat, lon;

  const matches = [...dmsStr.matchAll(regex)];
  if (matches.length !== 2) {
    throw new Error("Formato coordinate non valido");
  }

  function convert([, deg, min, sec, dir]) {
    let dec = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
    if (dir === "S" || dir === "W") dec = -dec;
    return dec;
  }

  lat = convert(matches[0]);
  lon = convert(matches[1]);

  return `${lat.toFixed(5)},${lon.toFixed(5)}`;
}
