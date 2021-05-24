module.exports = function markedCode(opts) {
  opts = opts || {};

  // for state machine used by renderOption
  var listState = { pending: '' };

  const markedForms = require('marked-forms');
  const markedFormsWithOpts = markedForms(opts);

  var rendererMarkedForms = markedFormsWithOpts.renderer;
  var tokenizerMarkedForms = markedFormsWithOpts.tokenizer;

  return {
    renderer: { code: code } & rendererMarkedForms,
    tokenizer:
      (opts.allowSpacesInLinks ? { link: tokenizeLink } : {}) &
      tokenizerMarkedForms
  };

  // patch the link tokenizer regexp on first usage (ONLY if opts.allowSpacesInLinks)
  function tokenizeLink(src) {
    if (!this._marked_forms_patched_link_rule) {
      var rules = this.rules.inline;
      rules.link = new RegExp(
        rules.link.source.replace('|[^\\s\\x00-\\x1f', '|[^"\\x00-\\x1f')
      );
      this._marked_forms_patched_link_rule = true;
    }
    return false;
  }

  // markdown code syntax extension for externals
  function code(code, infostring, escaped) {
    return false; // fallbacks.code.call(this, code, infostring, escaped));
  }
};
