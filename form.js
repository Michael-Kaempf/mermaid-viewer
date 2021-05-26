module.exports = function markedForm() {

  return { renderForm };

  function renderForm(text) {
    // Replace ~ with ~T
    // This lets us use tilde as an escape char to avoid md5 hashes
    // The choice of character is arbitray; anything that isn't
    // magic in Markdown will work.
    text = text.replace(/~/g, '~T');

    // Replace $ with ~D
    // RegExp interprets $ as a special character
    // when it's in a replacement string
    text = text.replace(/\$/g, '~D');

    // Standardize line endings
    text = text.replace(/\r\n/g, '\n'); // DOS to Unix
    text = text.replace(/\r/g, '\n'); // Mac to Unix
    // Make sure text begins and ends with a couple of newlines:
    text = '\n\n' + text + '\n\n';

    // Convert all tabs to spaces.
    text = _Detab(text);

    // Strip any lines consisting only of spaces and tabs.
    // This makes subsequent regexen easier to write, because we can
    // match consecutive blank lines with /\n+/ instead of something
    // contorted like /[ \t]*\n+/ .
    text = text.replace(/^[ \t]+$/gm, '');

    // Turns "name = ___" into form input element
    text = _CreateFormTextInput(text);

    return text;
  }

  function _Detab(text) {
    // Detab's completely rewritten for speed.
    // In perl we could fix it by anchoring the regexp with \G.
    // In javascript we're less fortunate.
    // expand first n-1 tabs
    text = text.replace(/\t(?=\t)/g, '    '); // g_tab_width
    // replace the nth with two sentinels
    text = text.replace(/\t/g, '~A~B');

    // use the sentinel to anchor our regex so it doesn't explode
    text = text.replace(/~B(.+?)~A/g, function(wholeMatch, m1, m2) {
      var leadingText = m1;
      var numSpaces = 4 - (leadingText.length % 4); // g_tab_width
      // there *must* be a better way to do this:
      for (var i = 0; i < numSpaces; i++) {
        leadingText += ' ';
      }
      return leadingText;
    });
    // clean up sentinels
    text = text.replace(/~A/g, '    ');
    text = text.replace(/~B/g, '');

    return text;
  }

  function _CreateFormTextInput(text) {
    return text.replace(
      /(\w[\w \t\-]*(\*)?)[ \t]*=[ \t]*___(\[\d+\])?/g,
      function(wholeMatch, lhs, required, size) {
        var cleaned = lhs
          .replace(/\*/g, '')
          .trim()
          .replace(/\t/g, ' ')
          .toLowerCase();
        var inputName = cleaned.replace(/[ \t]/g, '-'); // convert spaces to hyphens
        var labelName =
          cleaned
            .split(' ')
            .map(capitalize)
            .join(' ') + (required ? '*:' : ':');
        var template =
          '<label for="%id%" class="%labelClass%">%label%</label>' +
          '<input type="text" id="%id%" name="%id%" size="%size%" class="%inputClass%"/>';
        size = size ? size.match(/\d+/g)[0] : 20;
        var labelClass = required ? 'required-label' : '';
        var inputClass = required ? 'required-input' : '';
        return format(template, {
          id: inputName,
          label: labelName,
          size: size,
          labelClass: labelClass,
          inputClass: inputClass
        });
      }
    );
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function format(template, values) {
    //
    // Utility function that replaces placeholders with parameterized values
    //
    // Example:
    // Inputs:
    // template = 'Here is some text: %text%'
    // values = {'text', 'Hello I am text!'}
    //
    // Output:
    // 'Here is some text: Hello I am text!'
    //
    // @param template The template to do replacements on.  Fields to be replaced should be surrounded
    //                 by percentage signs (e.g. %field%)
    // @param values A Javascript object literal containing the names of the fields to be replaced
    //               along with the replacement values (e.g. {'field': 'Replacement text'}
    for (value in values) {
      template = template.replace(
        new RegExp('%' + value + '%', 'g'),
        values[value],
        'g'
      );
    }
    return template;
  }
};