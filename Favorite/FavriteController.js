const Favorite = require("./FavoriteModel");

const FavoriteConstroller = {
    getFavorite: (req, res) => {
       const { id } = req.params;
       const favorite = Favorite.findById({user: id}).populate('ad');
       if(!favorite){
        return res.status(404).json({ message: "No favorites found" });
       }
         res.status(200).json({ favorite });
    },
    addFavorite: (req, res) => {
       const { id } = req.params;
         const { adId } = req.body;
            const newFavorite = new Favorite({
                user: id,
                ad: adId
            });
            if(!newFavorite){
                return res.status(400).json({ message: "Favorite not added" });
            }
            newFavorite.save();
            res.status(201).json({ message: "Favorite added", favorite: newFavorite });
    },
    deleteFavorite: (req, res) => {
        const { id } = req.params;
        const favorite = Favorite.findOneAndDelete({user: id});
        if(!favorite){
            return res.status(404).json({ message: "Favorite not found" });
        }
        if(!favorite){
            return res.status(400).json({ message: "Favorite not deleted" });
        }
        res.status(200).json({ message: "Favorite deleted" });

    }
}

module.exports = FavoriteConstroller;