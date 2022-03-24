import * as dotenv from 'dotenv';
import { createServer } from "http";
import { sql } from '../../jscore/db/sqlUni';
import { statement } from '../../jscore/db/statement';

import config from '../ignoreVCS/ignoreCfg';
const path = require('path');
const express = require('express');
const cors = require('cors');


async function main() {
    config();
    dotenv.config();

    let app = express();
    app.use(cors());

    let stmt = await statement.getStmt();
    const httpServer = createServer(app);

    app.get('/', function (req, res) {
        res.sendFile(path.resolve(__dirname + '/../../front/index.html'));

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    });

    app.get('/country/(:id)', async function (req, res) {
        let row = await stmt.fetchRow("SELECT id, name, type, coords FROM country WHERE id = " + sql(req.params.id));
        if (row) {
            res.json(row);
        } else {

        }
    });

    app.get('/regions', async function (req, res) {
        let row = await stmt.fetchList("SELECT * FROM border_region");
        // let row = await stmt.fetchRow("SELECT regionId, name FROM regions");
        if (row) {
            res.json(row);
        } else {

        }
    });

    app.get('/region/(:id)', async function (req, res) {
        let row = await stmt.fetchRow("SELECT * FROM border_region WHERE regionId = " + sql(req.params.id));
        if (row) {
            res.json(row);
        } else {

        }
    });

    app.get('/districts/(:regionId)', async function (req, res) {
        let q = `
        SELECT 
            bd.id,
            bd.name,
            bd.coords,
            bd.type 
        FROM border_district bd
        JOIN oktmo o ON bd.id = o.ID
        WHERE RegionId = ${sql(req.params.regionId)}
        `;
        let rows = await stmt.fetchList(q);
        if (rows) {
            res.json(rows);
        } else {

        }
    });

    app.get('/objects', async (req, res) => {
        let rows = await stmt.fetchList(`SELECT * FROM map_objects`)
        if (rows) {
            res.json(rows)
        }
    })

    // let dirFront = __dirname + '/../front/';
    // let index.css

    // app.post('/', async function (req, res) {
    //     let timesFromCookie = req.cookies['isFilesChanged'];
    
    //     [
    //         fs.promises.stat(__dirname + '/../front/index.css'),
    //         fs.promises.stat(__dirname + '/../front/index.js')
    //     ]

    //     let stats = await Promise.allSettled(
    //     );
    
    //     let timesLocal = [0,1].map(v => (stats[v] as any)?.value.mtimeMs);
    //     let timesLocalStr = JSON.stringify(timesLocal);
    //     if (timesFromCookie === undefined || timesLocalStr !== timesFromCookie) {
    //         res.cookie('isFilesChanged', timesLocalStr);
    //         res.end('1');
    //     } else {
    //         res.end('0');
    //     }
    // });

    app.use(express.static(path.resolve(__dirname + '/../../front')));

    httpServer.listen(process.env.PORT);
}

main();