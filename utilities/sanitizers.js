function deepReplaceEscapeSequences(input) {
  if (Array.isArray(input)) {
    return input.map(deepReplaceEscapeSequences);
  } else if (typeof input === 'object') {
    return Object.keys(input).reduce((acc, key) => {
      acc[key] = deepReplaceEscapeSequences(input[key]);
      return acc;
    }, {});
  } else if (input !== undefined && input !== null) {
    return input.toString().replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|[|`]|\\/g, '');
  } else {
    return input; // Return input as-is if it's undefined or null
  }
}
/**
 * Takes an input and performs various transformations based on its type.
 * to ensure proper sanitization of the input by removing all potential escape characters!
 * @param {any} input - The input value to be transformed.
 * @return {any} - The transformed value.
 */
function es(input) {
  if (typeof input !== 'string' && typeof input === 'number') {
    // Handle numeric input
    input = input.toString().replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|[|`]|\\/g, '');
    return Number(input);
  }

  // Handle arrays
  if (Array.isArray(input)) {
    return deepReplaceEscapeSequences(input);
  }

  // Handle objects
  if (typeof input === 'object') {
    return deepReplaceEscapeSequences(input);
  }

  // Handle non-object input
  if (input !== undefined || null) {
    input = input.toString().replace(/\\([0-9a-fA-F]{2})|[\x00-\x1F\x7F-\x9F]|\\u([0-9a-fA-F]{4})|[|`]|\\/g, '');
  }

  return input;
}

const additionalSqliteCommands = [
  "CREATE VIEW",
  "DROP VIEW",
  "CREATE TRIGGER",
  "DROP TRIGGER",
  "REINDEX",
  "ANALYZE",
  "VACUUM",
  "SAVEPOINT",
  "RELEASE",
  "PRAGMA foreign_keys",
  "PRAGMA foreign_key_check",
  "PRAGMA foreign_key_list",
  "PRAGMA integrity_check",
  "PRAGMA journal_mode",
  "PRAGMA cache_size",
  "PRAGMA page_size",
  "PRAGMA synchronous",
  "PRAGMA temp_store",
  "PRAGMA wal_autocheckpoint",
  "PRAGMA foreign_key_check",
  "PRAGMA compile_options",
  "PRAGMA table_info",
  "PRAGMA index_info",
  "PRAGMA index_list",
  "PRAGMA busy_timeout",
  "PRAGMA incremental_vacuum",
  "PRAGMA writable_schema",
  "PRAGMA recursive_triggers",
  "PRAGMA application_id",
  "PRAGMA user_version",
  // Add more commands as needed
];
const sqliteCommands = [
  ...additionalSqliteCommands,
  // The commands you provided
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE TABLE",
  "ALTER TABLE",
  "DROP TABLE",
  "CREATE INDEX",
  "DROP INDEX",
  "BEGIN TRANSACTION",
  "COMMIT",
  "ROLLBACK",
  "ATTACH DATABASE",
  "DETACH DATABASE",
  "PRAGMA",
  ".mode",
  ".schema",
  ".backup",
  ".restore",
];

function ss(targetString) {
  if (typeof targetString === 'number'){
    return targetString;
  }
  return sqliteCommands.reduce((result, substring) => {
    if (result){
    console.log("Successfully replacing result:",result, "with substring:", substring);
    return result.replace(new RegExp(substring, "g"), "");
    }else{
      console.log('Couldnt replace subString:', substring, "With result:", result, "with typeof:", typeof targetString);
    }
  }, targetString);
}

function containsAnySubstring(targetString) {
  return sqliteCommands.some(substring => targetString.includes(substring));
}


module.exports = {ss, containsAnySubstring, es, deepReplaceEscapeSequences};