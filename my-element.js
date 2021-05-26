import { LitElement, html, css } from 'lit-element';
//import React from 'react';
//import ReactDOM from 'react-dom';
//import MDEditor from '@uiw/react-md-editor';
//import {} from '@vaadin/vaadin-button';
//import '@vaadin/vaadin-button';

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

\`\`\`form
name = ___
<
Please select = {option1 -> 1, option2 -> 2, (option3 -> 3)}
\`\`\`

<video src="https://github.com/Michael-Kaempf/mermaid-viewer/blob/master/forklift_puts_pallet_down.mp4?raw=true" style="width:75vw;height:auto" loop autoplay></video>

<!-- img src="https://github.com/Michael-Kaempf/mermaid-viewer/blob/master/neugif.gif?raw=true" style="width:75vw;height:auto"/ -->

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
    var marked = require('marked');

    var markedCode = require('./code-extension');
    //var markedCode = require('marked-forms');
    //var opts = { allowSpacesInLinks: true };
    var objectToUse = markedCode();

    marked.use(objectToUse);

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
