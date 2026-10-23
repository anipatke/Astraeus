// Node module-resolve hook: lets the importer load the donor's TypeScript
// entity files (extensionless relative imports) using Node's built-in type
// stripping. Read-only use of the donor; nothing is written there.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.')) {
      return nextResolve(`${specifier}.ts`, context)
    }
    throw error
  }
}
