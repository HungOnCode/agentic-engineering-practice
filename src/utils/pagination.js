const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Turns ?page and ?page_size query values into a SQL LIMIT/OFFSET pair
function getPagination(page, pageSize) {
  const limit = Math.min(MAX_PAGE_SIZE, parseInt(pageSize) || DEFAULT_PAGE_SIZE);
  const offset = ((parseInt(page) || 1) - 1) * limit;
  return { limit, offset };
}

module.exports = { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, getPagination };
