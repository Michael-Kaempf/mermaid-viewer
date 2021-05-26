function render(text) {
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

  // Turns expressions like "Please select = {option1, option2, (option3)}" into an HTML select
  // form input, with whichever option is in parentheses will be the default selection
  text = _CreateDropdownInput(text);

  // Turn block-level HTML blocks into hash entries
  text = _HashHTMLBlocks(text);

  // Strip link definitions, store in hashes.
  text = _StripLinkDefinitions(text);

  text = _UnescapeSpecialChars(text);

  return text;
}

var hashElement = function(wholeMatch, m1) {
  var blockText = m1;

  // Undo double lines
  blockText = blockText.replace(/\n\n/g, '\n');
  blockText = blockText.replace(/^\n/, '');

  // strip trailing blank lines
  blockText = blockText.replace(/\n+$/g, '');

  // Replace the element text with a marker ("~KxK" where x is its key)
  blockText = '\n\n~K' + (g_html_blocks.push(blockText) - 1) + 'K\n\n';

  return blockText;
};

var _UnescapeSpecialChars = function(text) {
  //
  // Swap back in all the special characters we've hidden.
  //
  text = text.replace(/~E(\d+)E/g, function(wholeMatch, m1) {
    var charCodeToReplace = parseInt(m1, 10);
    return String.fromCharCode(charCodeToReplace);
  });
  return text;
};

var _StripLinkDefinitions = function(text) {
  //
  // Strips link definitions from text, stores the URLs and titles in
  // hash references.
  //
  // Link defs are in the form: ^[id]: url "optional title"
  /*
		var text = text.replace(/
				^[ ]{0,3}\[(.+)\]:  // id = $1  attacklab: g_tab_width - 1
				  [ \t]*
				  \n?				// maybe *one* newline
				  [ \t]*
				<?(\S+?)>?			// url = $2
				  [ \t]*
				  \n?				// maybe one newline
				  [ \t]*
				(?:
				  (\n*)				// any lines skipped = $3 attacklab: lookbehind removed
				  ["(]
				  (.+?)				// title = $4
				  [")]
				  [ \t]*
				)?					// title is optional
				(?:\n+|$)
			  /gm,
			  function(){...});
	*/
  text = text.replace(
    /^[ ]{0,3}\[(.+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+)/gm,
    function(wholeMatch, m1, m2, m3, m4) {
      m1 = m1.toLowerCase();
      g_urls[m1] = _EncodeAmpsAndAngles(m2); // Link IDs are case-insensitive
      if (m3) {
        // Oops, found blank lines, so it's not a title.
        // Put back the parenthetical statement we stole.
        return m3 + m4;
      } else if (m4) {
        g_titles[m1] = m4.replace(/"/g, '&quot;');
      }

      // Completely remove the definition from the text
      return '';
    }
  );

  return text;
};

var _HashHTMLBlocks = function(text) {
  // attacklab: Double up blank lines to reduce lookaround
  text = text.replace(/\n/g, '\n\n');

  // Hashify HTML blocks:
  // We only want to do this for block-level HTML tags, such as headers,
  // lists, and tables. That's because we still want to wrap <p>s around
  // "paragraphs" that are wrapped in non-block-level tags, such as anchors,
  // phrase emphasis, and spans. The list of tags we're looking for is
  // hard-coded:
  var block_tags_a =
    'p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del';
  var block_tags_b =
    'p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math';

  // First, look for nested blocks, e.g.:
  //   <div>
  //     <div>
  //     tags for inner block must be indented.
  //     </div>
  //   </div>
  //
  // The outermost tags must start at the left margin for this to match, and
  // the inner nested divs must be indented.
  // We need to do this before the next, more liberal match, because the next
  // match will start at the first `<div>` and stop at the first `</div>`.
  // attacklab: This regex can be expensive when it fails.
  /*
		var text = text.replace(/
		(						// save in $1
			^					// start of line  (with /m)
			<($block_tags_a)	// start tag = $2
			\b					// word break
								// attacklab: hack around khtml/pcre bug...
			[^\r]*?\n			// any number of lines, minimally matching
			</\2>				// the matching end tag
			[ \t]*				// trailing spaces/tabs
			(?=\n+)				// followed by a newline
		)						// attacklab: there are sentinel newlines at end of document
		/gm,function(){...}};
	*/
  text = text.replace(
    /^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)\b[^\r]*?\n<\/\2>[ \t]*(?=\n+))/gm,
    hashElement
  );

  //
  // Now match more liberally, simply from `\n<tag>` to `</tag>\n`
  //
  /*
		var text = text.replace(/
		(						// save in $1
			^					// start of line  (with /m)
			<($block_tags_b)	// start tag = $2
			\b					// word break
								// attacklab: hack around khtml/pcre bug...
			[^\r]*?				// any number of lines, minimally matching
			.*</\2>				// the matching end tag
			[ \t]*				// trailing spaces/tabs
			(?=\n+)				// followed by a newline
		)						// attacklab: there are sentinel newlines at end of document
		/gm,function(){...}};
	*/
  text = text.replace(
    /^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math)\b[^\r]*?.*<\/\2>[ \t]*(?=\n+)\n)/gm,
    hashElement
  );

  // Special case just for <hr />. It was easier to make a special case than
  // to make the other regex more complicated.
  /*
		text = text.replace(/
		(						// save in $1
			\n\n				// Starting after a blank line
			[ ]{0,3}
			(<(hr)				// start tag = $2
			\b					// word break
			([^<>])*?			// 
			\/?>)				// the matching end tag
			[ \t]*
			(?=\n{2,})			// followed by a blank line
		)
		/g,hashElement);
	*/
  text = text.replace(
    /(\n[ ]{0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,
    hashElement
  );

  // Special case for standalone HTML comments:
  /*
		text = text.replace(/
		(						// save in $1
			\n\n				// Starting after a blank line
			[ ]{0,3}			// attacklab: g_tab_width - 1
			<!
			(--[^\r]*?--\s*)+
			>
			[ \t]*
			(?=\n{2,})			// followed by a blank line
		)
		/g,hashElement);
	*/
  text = text.replace(
    /(\n\n[ ]{0,3}<!(--[^\r]*?--\s*)+>[ \t]*(?=\n{2,}))/g,
    hashElement
  );

  // PHP and ASP-style processor instructions (<?...?> and <%...%>)
  /*
		text = text.replace(/
		(?:
			\n\n				// Starting after a blank line
		)
		(						// save in $1
			[ ]{0,3}			// attacklab: g_tab_width - 1
			(?:
				<([?%])			// $2
				[^\r]*?
				\2>
			)
			[ \t]*
			(?=\n{2,})			// followed by a blank line
		)
		/g,hashElement);
	*/
  text = text.replace(
    /(?:\n\n)([ ]{0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g,
    hashElement
  );

  // attacklab: Undo double lines (see comment at top of this function)
  text = text.replace(/\n\n/g, '\n');
  return text;
};

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

var _CreateDropdownInput = function(text) {
  //
  // Creates an HTML dropdown menu.
  //
  // Text can be one of two forms:
  // 1) Label Text = {Option1, Option2, (Option3)}
  //    becomes:
  //    <label for="label_text">Label Text:</label>
  //    <select id="label_text" name="label_text">
  //    <option value="Option1">Option1</option>
  //    <option value="Option2">Option2</option>
  //	  <option value="Option3" selected="selected">Option3</option>
  //    </select>
  // 2) Label Text = {Value1 -> Option1, (Value2 -> Option2)}
  //    becomes:
  //    <label for="label_text">Label Text:</label>
  //    <select id="label_text" name="label_text">
  //    <option value="Value1">Option1</option>
  //    <option value="Value2" selected="selected">Option2</option>
  //    </select>
  //
  // These can be mixed and matched, e.g. "Label Text = {Option1, Value2 -> Option2, Option3, (Value4 -> Option4)}"
  //
  // Any spaces on the left-hand side of the equal-sign will be converted into underscores
  // to use as the id and name fields for the label and select tags.
  //
  var regex = /(\w[\w \t_\-]*)=[ \t]*\{([a-zA-Z0-9 \t\->_,\(\)]+)\}/g;
  return text.replace(regex, function(whole, name, options) {
    var cleanedName = name.trim().replace(/\t/g, ' ');
    var id = cleanedName.replace(/[ \t]/g, '_').toLowerCase();
    var output =
      '<label for="' +
      id +
      '">' +
      cleanedName +
      ':</label>\n' +
      '<select id="' +
      id +
      '" name="' +
      id +
      '">';
    options.split(',').forEach(function(opt) {
      var selectedItemRegex = /\((.*)\)/g;
      // Test to see if option is surrounded by parens, indicating it's the default option
      var match = selectedItemRegex.exec(opt);
      var contents = match ? match[1].trim() : opt.trim();
      // Test to see if using the "value -> name" type of option
      var namedOptionRegex = /(.+)\->(.+)/g;
      var namedOptionMatch = namedOptionRegex.exec(contents);
      var optionName, optionValue;
      if (namedOptionMatch) {
        optionValue = namedOptionMatch[1].trim();
        optionName = namedOptionMatch[2].trim();
      } else {
        optionName = contents;
        optionValue = contents;
      }
      output +=
        '<option value="' +
        optionValue +
        '"' +
        (match ? ' selected="selected">' : '>') +
        optionName +
        '</option>';
    });
    output += '</select>\n';
    return output;
  });
};

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
  for (var value in values) {
    template = template.replace(
      new RegExp('%' + value + '%', 'g'),
      values[value],
      'g'
    );
  }
  return template;
}

export { render };
