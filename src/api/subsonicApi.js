


// Default configuration
var defaults = {
    host : "192.168.0.35:8080",
    user : "peguerosdc",
    password : "enc:66726f6e746d616e323132",
    version : "1.9.0"
}

// Define utils and helpers
function buildUrl(config, action, params = {}) {
    var base = `http://${config.host}/rest/${action}.view?u=${config.user}&p=${config.password}&v=${config.version}&f=json&c=myplayer`
    // Check if there are multiple valued keys
    const keys = Object.keys(params)
    for (var i = keys.length - 1; i >= 0; i--) {
        const key = keys[i]
        const value = params[key]
        if( Array.isArray(value) ) {
            // If an element has multiple values, add one key for each value
            base += value.map(val => `&${key}=${val}`).join("")
        }
        else {
            base += `&${key}=${value}`
        }
    }
    return base
}

function perform_api_call(url) {
    return fetch(url)
        .then(res => {
            if( res.ok ) {
                return res.json()
            }
            else {
                Promise.reject(Error(`${res.status}: ${res.statusText}`))
            }
        })
        .then(json => {
            var response = json["subsonic-response"]
            if( response["status"] === "ok") {
                return response
            }
            else {
                Promise.reject(Error(response["error"]["message"]))
            }
        })
}

// Define main function
class Subsonic {

    constructor(config) {
        this.config = config
    }

    login() {
        return perform_api_call( buildUrl(this.config, "ping") )
            .then(result => {
                return result["status"] === "ok"
            })
    }
    
    getArtists() {
        return perform_api_call( buildUrl(this.config, "getArtists") )
            .then(result => {
                return result["artists"]["index"]
            })
    }

    getArtist(id) {
        return perform_api_call( buildUrl(this.config, "getArtist", {id:id}) )
            .then(result => {
                return result["artist"]
            })
    }

    getAlbum(id) {
        return perform_api_call( buildUrl(this.config, "getAlbum", {id:id}) )
            .then(result => {
                return result["album"]
            })
    }

    getPlaylists() {
        return perform_api_call( buildUrl(this.config, "getPlaylists") )
            .then(result => {
                return result["playlists"]["playlist"]
            })
    }

    getPlaylistById(id) {
        return perform_api_call( buildUrl(this.config, "getPlaylist", {id:id}) )
            .then(result => {
                return result["playlist"]
            })
    }

    getCoverArtUrl(id) {
        return buildUrl(this.config, "getCoverArt", {id:id})
    }

    getStreamUrl(id) {
        return buildUrl(this.config, "stream", {id:id})
    }

    addSongsToPlaylist(playlistId, songIds) {
        return perform_api_call( buildUrl(this.config, "updatePlaylist", {playlistId:playlistId, songIdToAdd : songIds}) )
            .then(result => {
                return result["status"] === "ok"
            })
    }

    removeSongsFromPlaylist(playlistId, songIndexes) {
        return perform_api_call( buildUrl(this.config, "updatePlaylist", {playlistId:playlistId, songIndexToRemove : songIndexes}) )
            .then(result => {
                return result["status"] === "ok"
            })
    }

}

// Export instance
var subsonic = new Subsonic(defaults)
// Allow use of default import syntax in TypeScript
module.exports = subsonic
module.exports.default = subsonic