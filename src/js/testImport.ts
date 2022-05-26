export default function testImport () {
  const modules = import.meta.globEager('/src/import/*.js')

  return modules
}
