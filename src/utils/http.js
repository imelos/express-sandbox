function formatEtag(version) {
  return `"${version}"`;
}

function parseIfNoneMatch(value) {
  if (!value) {
    return null;
  }

  return value.trim();
}

module.exports = {
  formatEtag,
  parseIfNoneMatch
};
