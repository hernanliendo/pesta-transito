import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// hot reload based on https://daveceddia.com/hot-reloading-create-react-app/
// import {AppContainer} from 'react-hot-loader';

ReactDOM.render(<App/>, document.getElementById('root'));
// ReactDOM.render(<AppContainer><App/></AppContainer>, document.getElementById('root'));

// if (module.hot) {
//     module.hot.accept();
// }

serviceWorker.unregister();
