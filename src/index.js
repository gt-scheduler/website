import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import * as reducers from './reducers';
import App from './components/App';
import './stylesheet.scss';

const store = createStore(combineReducers(reducers));

ReactDOM.render(<Provider store={store}><App/></Provider>, document.getElementById('root'));
