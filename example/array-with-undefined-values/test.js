const resultsUndefined = Array(10).map(() => 0)
console.log(resultsUndefined[0]); // undefined

const resultsZero = Array.from({length: 10}, () => 0)
console.log(resultsZero[0]); // 0
