import React from 'react'
import PropTypes from 'prop-types'
import { navigate } from "@reach/router"
// Utils
import { Howl } from 'howler'
import subsonic from "../../api/subsonicApi"
import { seconds_to_mss } from "../../utils/formatting.js"
import * as settings from "../../utils/settings.js"
// UI
import { IconButton, Icon } from 'rsuite'
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import "./MusicPlayer.less"

export default class MusicPlayer extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = { playing:false, tick: 0, isMuted: false, volume: settings.getVolume() }
        this.volumeBeforeMutting = 1.0
        this.isSeeking = false

        if ('mediaSession' in navigator) {            
            navigator.mediaSession.setActionHandler('play', this.play.bind(this));
            navigator.mediaSession.setActionHandler('pause', this.pause.bind(this));
            navigator.mediaSession.setActionHandler('previoustrack', this.playPreviousSong.bind(this));
            navigator.mediaSession.setActionHandler('nexttrack', this.playNextSong.bind(this));
        }
    }

    play() {
        if (!this.state.playing) {
            this.togglePlayerState();
        }
    }

    pause() {
        if (this.state.playing) {
            this.togglePlayerState();
        }
    }

    componentDidUpdate(prevProps) {
        // Check if there is a song to play
        if( this.props.song ) {
            var playNextSong = this.props.playNextSong
            var previousSong = prevProps.song ? prevProps.song : {}
            if( this.props.song.id !== previousSong.id) {
                const shouldScrobble = settings.getIsScrobbling()
                // Stop the current song if playing
                this.clearMusicPlayer()
                // Mark the previous song as submitted if it was played enough to scrobble
                if( shouldScrobble && this.isTickingEnoughToScrobble(previousSong, this.state.tick) ) {
                    subsonic.scrobble(previousSong.id, Date.now(), true)
                }
                // Stop the previous song to prevent both songs to play at the same time
                const newSong = this.props.song
                this.streamer = new Howl({
                    src: [subsonic.getStreamUrl(newSong.id)],
                    ext: ['mp3'],
                    preload: false,
                    pool: 2,
                    autoplay: true,
                    html5: true,
                    volume: this.state.volume,
                    // Play next song
                    onend: function() {
                        playNextSong()
                    }
                })
                this.streamer.play()
                this.startSongTicker()
                this.isSeeking = false
                this.setState({playing : true, tick: 0})
                // Update title
                document.title = `${newSong.title} - ${newSong.artist}`
                // Scrobble
                shouldScrobble && subsonic.scrobble(newSong.id, Date.now(), false)
            }
        }
        // If there is no song to play, stop whatever was playing
        else {
            this.clearMusicPlayer()
            // Update title
            document.title = "SubPlayer"
        }
    }

    startSongTicker() {
        clearInterval(this.timerID)
        this.timerID = setInterval(() => {
            if( this.state.playing ) {
                this.tick()
            }
        }, 1000)
    }

    tick() {
        if( !this.isSeeking ) {
            this.setState({
                tick: Math.ceil(this.streamer.seek())
            })
        }
    }

    isTickingEnoughToScrobble(song, tick) {
        /* https://www.last.fm/api/scrobbling#when-is-a-scrobble-a-scrobble
         * Send scrobble if:
         * 1. if the song is longer than 30 seconds AND
         * 2. the song was played for at least 50% of its length OR
         * 3. the song was played for at least 4 minutes
         */
        const duration = song.duration
        return duration > 30 && (tick >= .5*duration || tick >= 4*60 )
    }

    onSeeking = (value) => {
        if( this.streamer ) {
            this.isSeeking = true
            this.setState({tick: value})
        }
    }

    onSeekingStopped = (value) => {
        if( this.isSeeking ) {
            this.isSeeking = false
            this.streamer.seek(value)
            this.setState({tick: value})
        }
    }

    componentWillUnmount() {
        clearInterval(this.timerID)
        // Stop the current song if playing
        this.clearMusicPlayer()
    }

    changeVolume = (newVolume) => {
        this.streamer && this.streamer.volume(newVolume)
        this.setState({volume: newVolume})
        this.volumeBeforeMutting = newVolume
        // update settings
        settings.setVolume(newVolume)
    }

    toggleMute = () => {
        const isMuted = this.state.isMuted
        if( isMuted ) {
            this.streamer && this.streamer.volume(this.volumeBeforeMutting)
            this.setState({ volume : this.volumeBeforeMutting, isMuted: false })
        }
        else {
            this.streamer && this.streamer.volume(0.0)
            this.setState({ volume : 0.0, isMuted: true })
        }
    }

    togglePlayerState = () => {
        if( this.streamer ) {
            if(this.state.playing) {
                this.streamer.pause()
            }
            else {
                this.streamer.play()
            }
            this.setState({ playing : !this.state.playing })
        }
    }

    toggleStarOnSong = () => {
        if( this.props.song && this.props.setStarOnSongs ){
            this.props.setStarOnSongs([this.props.song], !this.props.song.starred)
        }
    }

    toggleShuffle = () => {
        this.props.toggleShuffle(!this.props.isShuffleOn)
    }

    goToQueueView = () => {
        navigate("/queue/")
    }

    goToArtist = (artistId) => {
        navigate(`/artists/${artistId}`)
    }

    goToAlbum = (albumId) => {
        if( albumId ) {
            navigate(`/album/${albumId}`)
        }
    }

    playNextSong = () => {
        this.props.playNextSong && this.props.playNextSong()
    }

    playPreviousSong = () => {
        // if the song has just started (according to a defined threshold), play
        // the previous song. If not, go back to the beginning of this song
        if( this.state.playing ) {
            const currentSeconds = this.streamer ? this.streamer.seek() : 0
            if( currentSeconds <= 3 ) {
                this.props.playPreviousSong && this.props.playPreviousSong()
            }
            else {
                this.streamer.seek(0)
                this.tick()
            }
        }
    }

    clearMusicPlayer = () => {
        if( this.streamer ) {
            this.streamer.stop()
            this.streamer.unload()
        }
        clearInterval(this.timerID)
        // "Reset" UI
        this.state.playing && this.setState({playing : false, tick: 0})
    }

    render () {
        const song = this.props.song ? this.props.song : {}
        const playing = this.state.playing
        const seek = this.state.tick
        const starIcon = song.starred ? "star" : "star-o"
        const volume = this.state.volume
        const isShuffleOn = this.props.isShuffleOn
        return (
            <div className="music-player">
                {/* Currently playing information */}
                <div className="song_metadata_container">
                    <img id="song_album" src={song.coverArt ? subsonic.getCoverArtUrl(song.coverArt) : "/currently_placeholder.png"} alt="cover" width="45" height="45" onClick={e => this.goToAlbum(song.albumId)}/>
                    <div style={{overflow:"hidden"}}>
                        <p id="song_name"><b>{song.title}</b></p>
                        <span id="song_artist" className="artist-link" onClick={e => this.goToArtist(song.artistId)}>{song.artist}</span>
                    </div>
                    <IconButton id="star_button" icon={<Icon icon={starIcon} />} onClick={this.toggleStarOnSong} appearance="link" size="lg"/>
                </div>
                {/* Music player controls */}
                <div className="currently_playing_controls">
                    <IconButton id="previous_button" icon={<Icon icon="step-backward" />} appearance="link" size="sm" onClick={this.playPreviousSong}/>
                    <IconButton id="play_pause_button" appearance="primary" icon={<Icon icon={playing ? "pause" : "play"} />} circle size="sm" onClick={this.togglePlayerState} />
                    <IconButton id="next_button" icon={<Icon icon="step-forward" />} appearance="link" size="sm" onClick={this.playNextSong} />
                </div>
                {/* Song seeking controls */}
                <div style={{flexGrow:1}} className="rs-hidden-xs">
                    <div className="song_progress_bar_container">
                        <span>{seconds_to_mss(seek)}</span>
                        <Slider className="rs-slider song_progress_bar" value={seek} onChange={this.onSeeking} onAfterChange={this.onSeekingStopped} max={song.duration || 0} />
                        <span>{seconds_to_mss(song.duration || 0)}</span>
                    </div>
                </div>
                {/* Toggle shuffle */}
                <div className="shuffle_container rs-hidden-xs">
                    <IconButton id="shuffle_button" icon={<Icon icon="random" inverse={!isShuffleOn} />} onClick={this.toggleShuffle} appearance="link" size="lg"/>
                </div>
                {/* Go to queue */}
                <div className="go_to_queue_container">
                    <IconButton id="queue_button" icon={<Icon icon="bars" />} onClick={this.goToQueueView} appearance="link" size="lg"/>
                </div>
                {/* Volume controls */}
                <div className="rs-hidden-xs">
                    <div className="volume_controls_container">
                        <IconButton id="mute" onClick={this.toggleMute} icon={<Icon className="volume_control_mute" icon={volume === 0 ? 'volume-off' : 'volume-up'} />} appearance="link" />
                        <Slider className="volume_control_bar" value={volume} onChange={this.changeVolume} defaultValue={1} max={1} step={0.05} />
                    </div>
                </div>
            </div>
        )
    }
}

MusicPlayer.propTypes = {
    playNextSong : PropTypes.func,
    playPreviousSong : PropTypes.func,
    setStarOnSongs : PropTypes.func,
    toggleShuffle : PropTypes.func,
    song : PropTypes.object,
    isShuffleOn: PropTypes.bool,
}
