import ts from 'typescript';
import prettier from 'prettier';

const getPrintThisType = (programFiles: string[], tsConfig: ts.CompilerOptions, apiDefinitionFilePath: string) => {
  // create a typescript program from a filepath
  const program = ts.createProgram(programFiles, tsConfig);
  const sourceFile = program.getSourceFile(apiDefinitionFilePath);
  if (!sourceFile) {
    return undefined;
  }

  let myNode: ts.Node | undefined = undefined;
  let jsDocText: string | undefined;
  // traverse the root nodes of the file, looking for a node that includes the text 'PrintThisType' in a JSDoc comment.
  sourceFile.forEachChild((node) => {
    console.log(node);
    if ((node as any).jsDoc && (node as any).jsDoc[0] && (node as any).jsDoc[0].comment && (node as any).jsDoc[0].comment.includes('PrintThisType')) {
      myNode = node;
      jsDocText = (myNode as any).jsDoc[0].comment;
    }
  });
  if (!myNode) {
    return undefined;
  }

  const typeChecker = program.getTypeChecker();
  // get a fully resolved type
  const myType = typeChecker.getTypeAtLocation(myNode);
  // print to an (ugly) string
  const typeToString = typeChecker.typeToString(myType, myNode, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.MultilineObjectLiterals);
  // make sure to add the `type` keyword and the name of the definition (from the node itself) to the string!
  return { typeDef: `type ${(myNode as any).name.escapedText} = ${typeToString} `.replace(/ {4}/g, "\n"), jsDocText };
};

type TypeDetails = { typeDef: string; jsDocText: string };
const getPrintThisTypes = (programFiles: string[], tsConfig: ts.CompilerOptions, filePaths: string[]) => {
  // read CLI arguments, throw error if no paths provided
  if (!filePaths.length) {
    throw Error("No file paths provided");
  }
  console.log('printing types for:', filePaths, "\n\n\n");
  const definitions = filePaths
    .map(file => getPrintThisType(programFiles, tsConfig, file))
    // filter out any invalid or non-existent
    .filter((def): def is TypeDetails => !!def)
    // create a nicely formatted string with prettier!
    .map(({ typeDef, jsDocText }) => {
      return {
        typeDef: prettier.format(typeDef, { semi: true, parser: 'typescript' }),
        jsDocText
      };
    });
  definitions.forEach(({ typeDef, jsDocText }) => {
    console.log(typeDef);
    console.log({ jsDocText }, "\n");
  });
};

// Note: we must pass the tsconfig (critically, with `strictNullChecks = true`) for any zod inference to work correctly!
// Big thanks to this for the following code: https://stackoverflow.com/a/62025646
const configPath = ts.findConfigFile(".", ts.sys.fileExists, "tsconfig.json");
if (!configPath) {
  throw new Error("Could not find a valid 'tsconfig.json'.");
}
const configFile = ts.readJsonConfigFile(configPath, ts.sys.readFile);
const { fileNames: programFiles, options: tsConfig } = ts.parseJsonSourceFileConfigFileContent(configFile, ts.sys, './');
console.log(programFiles, tsConfig);

// get the stuff
getPrintThisTypes(programFiles, tsConfig, process.argv.slice(2));