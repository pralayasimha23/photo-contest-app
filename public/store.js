const STORE = {
    photos: [],
    deleteById: function(id) {
        this.photos = this.photos.filter(photo => {
            return photo._id !== id; 
        });
    },
    update: function(photo) {
        const id = photo._id; 
        const index = this.photos.findIndex(_photo => {
            return _photo._id == id; 
        });
        this.photos[index] = photo; 
    }
}