import { LitElement, html, css } from 'lit-element';
import React from 'react';
import ReactDOM from 'react-dom';
import MDEditor from '@uiw/react-md-editor';

const renderers = {
  code: ({ inline, children, className, ...props }) => {
    const txt = children[0] || '';
    if (inline) {
      if (typeof txt === 'string' && /^\$\$(.*)\$\$/.test(txt)) {
        const html = katex.renderToString(txt.replace(/^\$\$(.*)\$\$/, '$1'), {
          throwOnError: false
        });
        return <code dangerouslySetInnerHTML={{ __html: html }} />;
      }
      return <code>{txt}</code>;
    }
    if (typeof txt === 'string' && typeof className === 'string') {
      if (/^language-wiky/.test(className.toLocaleLowerCase())) {
        var wiky = require('wiky');
        const html = wiky.toHtml(txt);
        return <code dangerouslySetInnerHTML={{ __html: html }} />;
      } else if (/^language-mermaid/.test(className.toLocaleLowerCase())) {
        var mermaid = require('mermaid');
        const svg = mermaid.render('demo', txt);
        return <code dangerouslySetInnerHTML={{ __html: svg }} />;
      }
    }
    return <code className={String(className)}>{txt}</code>;
  }
};
class MyElement extends LitElement {
  constructor(...args) {
    super(...args);
  }

  render() {
    return html`
      <span id="container"></span>
    `;
  }

  async firstUpdated() {
    // Give the browser a chance to paint
    await new Promise(r => setTimeout(r, 0));

    const markdown = `The following are some examples of the diagrams, charts and graphs that can be made using Mermaid and the Markdown-inspired text specific to it . 

[Provide a Name ??]()

<img src="https://github.com/Michael-Kaempf/mermaid-viewer/blob/master/neugif.gif?raw=true" style="width:75vw;height:auto"/>

<style>
h1 {
  color: red;
}
</style>
<h1>DDD</h1>

That is so funny! :joy:

- [x] Write the press release
- [ ] Update the website
- [ ] Contact the media

| Syntax      | Description | Test Text     |
| :---        |    :----:   |          ---: |
| Header      | Title       | Here's this   |
| Paragraph   | Text        | And more      |

## Example text
Multiple sentences (-with multiple words-) form a paragraph.\\ Multiple ^sentences^ with ~multiple~ words %form% a paragraph.
Avoid \\*overlapping \\_inline\\* code\\_.

The [W3C](http://w3.org) is the ![Home](https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r2.png "Home2") of web standards like ?HTML(Hypertext Markup Language)?.

[(http://www.brainyquote.com/quotes/authors/a/albert_einstein.html,Albert Einstein)"Any man who can drive safely while kissing a pretty girl is simply not giving the kiss the attention it deserves."]

\`\`\`
 _    _   _   _  _   _   _ 
( )  ( ) ( ) ( )/ ) ( ) ( )
| |/\\| | | | |   (   \\ ^ /
(__/\\__) (_) (_)\\_)   (_)
\`\`\`

\`\`\`mermaid
graph TD
A[Hard] -->|Text| B(Round)
B --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]
\`\`\`

\`\`\`mermaid
sequenceDiagram
Alice->>John: Hello John, how are you?
loop Healthcheck
    John->>John: Fight against hypochondria
end
Note right of John: Rational thoughts!
John-->>Alice: Great!
John->>Bob: How about you?
Bob-->>John: Jolly good!
\`\`\`
`;

    const mountPoint = this.shadowRoot.getElementById('container');
    //    const ttt = { renderers: renderers };
    //    const renderResult = ReactDOM.render(
    //      <MDEditor.Markdown source={markdown || ''} components={renderers} />,
    //      mountPoint
    //    );
    var marked = require('marked');

    var markedCode = require('./code-extension');
    var opts = { allowSpacesInLinks: true };
    marked.use(markedCode(opts)); // optional opts { allowSpacesInLinks: true }

    var html = marked(markdown);

    mountPoint.innerHTML = html;
  }

  static get is() {
    return 'my-element';
  }

  static get styles() {
    return css``;
  }

  clicked() {
    var mermaid = require('mermaid');
    mermaid.render('theGraph', 'Hello Markdown!', function(svgCode) {
      output.innerHTML = svgCode;
    });
  }
}

customElements.define(MyElement.is, MyElement);
