import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import WebFontLoader from 'webfontloader';
// hot reload based on https://daveceddia.com/hot-reloading-create-react-app/
// import {AppContainer} from 'react-hot-loader';

WebFontLoader.load({
    google: {
        families: ['Roboto:300,400,500,700', 'Material Icons'],
    },
});

ReactDOM.render(<App/>, document.getElementById('root'));
// ReactDOM.render(<AppContainer><App/></AppContainer>, document.getElementById('root'));

// if (module.hot) {
//     module.hot.accept();
// }

registerServiceWorker();
