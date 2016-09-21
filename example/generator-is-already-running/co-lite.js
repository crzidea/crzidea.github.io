coLite(function* () {
  yield Promise.resolve(1)
  yield new Promise((resolve) => {
    setTimeout(_ => resolve(2), 1000)
  })
  return Promise.resolve(3)
})

function coLite(generatorFunction) {
  var generator = generatorFunction()

  function runGenerator(returnValue) {
    var iterator = generator.next(returnValue)
    iterator.value
    .then((value) => {
      console.log(`value: ${value}`);
      if (iterator.done) {
        return
      }
      iterator = null
      runGenerator(value)
    })
    .catch((e) => {
      console.error(e.stack);
      generator.throw(e)
    })
  }

  runGenerator()
}
