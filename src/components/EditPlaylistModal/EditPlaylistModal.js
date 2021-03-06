import React from "react"
import PropTypes from 'prop-types'
// UI
import { Button, Modal, Form, FormGroup, ControlLabel, Input, Checkbox } from 'rsuite'

export default class EditPlaylistModal extends React.Component {

    constructor(props) {
        super(props)
        this.state = {editNameError : false}
        this.tempPlaylist = {}
    }

    componentDidUpdate(prevProps) {
        if( !prevProps.show && this.props.show ) {
            this.setTempPlaylistToDefault(this.props.playlist)
        }
    }

    setTempPlaylistToDefault = (playlist) => {
        this.tempPlaylist = { name: playlist.name, comment : playlist.comment, public : playlist.public }
    }

    closeEditModal = () => {
        this.props.onHide && this.props.onHide()
        this.setState({editNameError : false})
        this.setTempPlaylistToDefault(this.props.playlist)
    }

    closeModalAndEdit = (event) => {
        // Do not submit form until data is checked
        if( event ){
            event.stopPropagation()
            event.preventDefault()
        }
        // Check data
        if( !this.tempPlaylist.name ) {
            this.setState({editNameError : true})
        }
        else {
            this.props.editPlaylist(this.props.playlist.id, this.tempPlaylist.name, this.tempPlaylist.comment, this.tempPlaylist.public)
            this.props.onHide && this.props.onHide()
            this.setState({editNameError : false})
        }
    }

    render() {
        const playlist = this.props.playlist || { id:"", name:"", songCount:0, duration:0, isMine:false}
        return (
            <Modal {...this.props} className="subplayer-modal" backdrop="static" onHide={this.closeEditModal} size="xs">
                <Modal.Header>
                    <Modal.Title>Edit Playlist</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form fluid onSubmit={this.closeModalAndEdit}>
                        <FormGroup>
                            <ControlLabel>Name</ControlLabel>
                            <Input id="name" name="name" defaultValue={playlist.name} onChange={(value => {this.tempPlaylist.name = value})} style={{width:"100%"}} />
                            { this.state.editNameError ? <span id="nameErrorMessage" style={{color:"red"}}>A name is required</span> : null }
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel>Comment</ControlLabel>
                            <Input id="comment" name="comment" defaultValue={playlist.comment} style={{width:"100%"}} onChange={(value => {this.tempPlaylist.comment = value})} />
                        </FormGroup>
                        <FormGroup>
                            <Checkbox id="isPublic" name="isPublic" defaultChecked={playlist.public} onChange={((value, checked) => {this.tempPlaylist.public = checked})}>Public</Checkbox>
                        </FormGroup>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button id="editButton" type="submit" appearance="primary" onClick={this.closeModalAndEdit}> Save </Button>
                    <Button id="cancelButton" onClick={this.closeEditModal} appearance="subtle"> Cancel </Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

EditPlaylistModal.propTypes = {
    onHide: PropTypes.func,
    playlistId : PropTypes.string.isRequired,
    editPlaylist : PropTypes.func.isRequired,
}
