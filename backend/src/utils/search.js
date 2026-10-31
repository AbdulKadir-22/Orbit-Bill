const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const buildSearchQuery = (term, fields = []) => {
  if (!term || typeof term !== 'string' || !term.trim() || !fields.length) {
    return {};
  }

  const safeTerm = escapeRegex(term.trim());
  const regex = new RegExp(safeTerm, 'i');

  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

module.exports = {
  escapeRegex,
  buildSearchQuery,
};
