import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { sign } from './backend/signature.web';

class App extends React.Component {
  state = { signature: '', message: '' };

  async sign() {
    this.setState({ signature: await sign(this.state.message) });
  }

  render() {
    return (
      <div>
        <input
          id="message"
          value={this.state.message}
          onChange={e => this.setState({ message: e.target.value })}
        />
        <button id="sign" onClick={() => this.sign()}>
          Sign
        </button>
        {this.state.signature ? (
          <span id="signature">{this.state.signature}</span>
        ) : null}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
