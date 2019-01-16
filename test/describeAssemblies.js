function selectAssemblies (assemblies) {
  if (process.env.ASSEMBLIES) {
    const selectedAssemblies = new Set(process.env.ASSEMBLIES.split(','))
    return assemblies.filter((assembly) => selectedAssemblies.has(assembly.name))
  } else {
    return assemblies
  }
}

function describeAssemblies (assemblies, cb) {
  selectAssemblies(assemblies).forEach(function (assembly) {
    describe(`assembly: ${assembly.name}`, function () {
      cb.call(this, assembly)
    })
  })
}

module.exports = describeAssemblies
