module.exports = function markedCode(opts) {
  opts = opts || {};

  // for state machine used by renderOption
  var listState = { pending: '' };

  var markedForms = require('marked-forms');

  //var rewire = require('rewire');
  const rewire = require('rewire');
  //var markedForms = rewire('marked-forms');

  var renderOption = function(text, value) {
    var out;
    var list = listState;

    if (list.type === 'select') {
      out =
        '\n<option' +
        attr('name', list.name) +
        attr('value', value, true) +
        '>';
      return out + text + '</option>';
    }

    var id = list.modern ? list.id + '-' + ++list.count : '';
    var type = { checklist: 'checkbox', radiolist: 'radio' }[list.type];
    var openLabel = text
      ? '\n<label' + attr('class', type) + attr('for', id) + '>'
      : '';
    var closeLabel = text ? '</label>' : '';

    out =
      '<input' +
      list.required +
      list.checked +
      attr('id', id) +
      attr('class', list.required) +
      attr('type', type) +
      attr('name', list.name) +
      attr('value', value, true) +
      '>';

    if (list.modern && list.labelFirst)
      return (
        '<li class="' +
        type +
        '">' +
        openLabel +
        text +
        closeLabel +
        out +
        '</li>'
      );
    if (list.modern && !list.labelFirst)
      return (
        '<li class="' +
        type +
        '">' +
        out +
        openLabel +
        text +
        closeLabel +
        '</li>'
      );
    if (!list.modern && list.labelFirst)
      return openLabel + text + out + closeLabel;
    if (!list.modern && !list.labelFirst)
      return openLabel + out + text + closeLabel;
  };
  //  });
  //markedForms.__set__('renderOption', renderOption);
  markedForms.renderOption = renderOption;

  var markedFormsWithOpts = markedForms(opts);
  markedFormsWithOpts.renderOption = renderOption;

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
