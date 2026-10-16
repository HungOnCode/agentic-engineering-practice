// A duplicate on a UNIQUE column and on a PRIMARY KEY are reported with different codes
const UNIQUE_VIOLATION_CODES = ['SQLITE_CONSTRAINT_UNIQUE', 'SQLITE_CONSTRAINT_PRIMARYKEY'];

function isUniqueViolation(err) {
  return UNIQUE_VIOLATION_CODES.includes(err && err.code);
}

module.exports = { isUniqueViolation };
