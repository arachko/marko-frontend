
const colors = [
  "#3366cc", "#dc3912", "#109618", "#ff9900", "#990099", "#0099c6", "#dd4477", "#66aa00",
  "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707",
  "#651067", "#329262", "#5574a6", "#3b3eac"
];

export function parseGroupingBy(data, xDimension, yDimension, groupByDimension, nameGenerator, colorArray = [], idArray = []) {
  // <Key,value> dict where key is the value we are grouping by, and the value is the index of the line
  // E.g.: suppose we are grouping by a groupDimension called "id", and there is 3 unique id's on the data
  // So for each unique id we found, a new line will be added. The id value will be the key, and the index of
  // the correspondent line will be the value
  const map = new Map();

  const addValue = (d, i) => {
    lines[i].points.push({
      x: d[xDimension],
      y: d[yDimension],
      sharpe: d["sharpe"],
      weights: d["weights"]
    });
  };

  const nameFunc = typeof nameGenerator === "function" ? nameGenerator : (i) => `Grouped by ${groupByDimension} = ${i}`;

  const lines = [];

  data.forEach(d => {
    let key = d[groupByDimension];
    if ( map.has(key) ) { // We already have added a key like this one, so there's already a line for it
      let i = map.get(key); // Get correct index
      addValue(d, i); // Add value to points array
    } else { // Here we haven't added a new line for this key
      let i = lines.length;
      lines.push({
        id: idArray[i] || `${xDimension}-${yDimension}-by-${groupByDimension}-${key}`,
        name: nameFunc(key),
        color: colorArray[i] || colors[i % colors.length],
        points: []
      });
      map.set(key, i); // Set the <key,value> pair
      addValue(d, i);
    }
  });

  return lines;
}