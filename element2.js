import React from 'react';
import ReactDOM from 'react-dom';
import MDEditor from '@uiw/react-md-editor';

class Box extends React.Component {
  //  const [value, setValue] = React.useState('**Hello world!!!**');
  render() {
    return (
      <div className="container">
        <MDEditor.Markdown source={value} />
      </div>
    );
  }
}
//ReactDOM.render(<App />, document.getElementById('container'));
