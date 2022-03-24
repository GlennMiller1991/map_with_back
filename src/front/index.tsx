import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';

const DG = require('2gis-maps');
DG.plugin('https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js')
    // доп либа по кластеризации
    .then(
        function () {
            ReactDOM.render(
                <App/>,
                document.getElementById('root')
            )
            ;
        }
    )
