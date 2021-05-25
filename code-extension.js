module.exports = function markedCode(opts) {

  opts = opts || {};

  var markedForms = require('./markedForms');

  var markedFormsWithOpts = markedForms(opts);

  var rendererMarkedForms = markedFormsWithOpts.renderer;
  var tokenizerMarkedForms = markedFormsWithOpts.tokenizer;

  const newRenderer = Object.assign({}, rendererMarkedForms, { code: code });

  return {
    renderer: newRenderer,
    //    tokenizer: opts.allowSpacesInLinks ? { link: tokenizeLink } : {}
    tokenizer: tokenizerMarkedForms
  };

  // markdown code syntax extension for externals
  function code(code, infostring, escaped) {
    if ('mermaid' === infostring) {
      var mermaid = require('mermaid');
      const svg = mermaid.render('demo', code);
      return svg;
    }
    return false; // fallbacks.code.call(this, code, infostring, escaped));
  }
};
