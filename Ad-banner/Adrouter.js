const express = require('express');
const AdController = require('./AdController');
const authmiddleware = require('../Config/Midelwere');
const Adrouter = express.Router();

Adrouter.post('/create',authmiddleware,AdController.crateAd);
Adrouter.get('/embed/:id',AdController.getEmbedCode);
Adrouter.get('/list',authmiddleware,AdController.getAds);
Adrouter.put('/update/:id',authmiddleware,AdController.updateAd);
Adrouter.delete('/delete/:id',authmiddleware,AdController.deleteAd);
Adrouter.get("/click/:id", AdController.trackClick);

module.exports = Adrouter;