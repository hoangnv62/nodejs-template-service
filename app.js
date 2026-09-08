import stockRoute from "#routes/stock.route.js";
import {errorHandler} from "#exception/error-handler.js";

import express from 'express';
import authRoute from "#routes/auth.route.js";
const app = express();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit:'50mb', extended: true }));
const API_PREFIX = '/nodejs-template/api';
app.get(API_PREFIX, (req, res) => {
    res.json({message: 'Hello World!'});
})

app.use(`${API_PREFIX}/stocks`, stockRoute)
app.use(`${API_PREFIX}/authenticate`, authRoute)
app.use(errorHandler)
app.listen(3000, () => {
    console.log('Server is running on port 3000');
})