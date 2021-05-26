module.exports = function markedCode() {
  return {
    renderer: { code: code }
  };

  // markdown code syntax extension for externals
  function code(code, infostring, escaped) {
    if ('mermaid' === infostring) {
      var mermaid = require('mermaid');
      const svg = mermaid.render('demo', code);
      return svg;
    } else if ('form' === infostring) {
      var markedForm = require('./markedForm');
      var result = markedForm.render(code);
      return result;
    }
    return false; // fallbacks.code.call(this, code, infostring, escaped));
  }
};
