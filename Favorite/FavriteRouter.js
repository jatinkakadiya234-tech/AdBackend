const express = require('express');
let FavoriteRouter = express.Router();
const FavoriteConstroller = require('./FavriteController');

FavoriteRouter.post('/add/:id', FavoriteConstroller.addFavorite);
FavoriteRouter.get('/get/:id', FavoriteConstroller.getFavorite);
FavoriteRouter.delete('/delete/:id', FavoriteConstroller.deleteFavorite);

module.exports = FavoriteRouter;