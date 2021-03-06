import React from "react"
import PropTypes from 'prop-types'
// Utils
import subsonic from "../../api/subsonicApi"
// UI
import { Grid, Row, Col } from 'rsuite'
import AlbumResult from "../SearchAlbumResult"
import "./RecentlyAddedView.less"

export default class RecentlyAddedView extends React.Component {

    constructor(props) {
        super(props)
        this.state = {albums : []}
    }

    componentDidMount = async () => {
        // Get the newest albums from Subsonic
        this.props.beginAsyncTask()
        try {
            const albums = await subsonic.getAlbumList2("newest")
            this.props.asyncTaskSuccess()
            this.setState({albums})
        }
        catch(err) {
            console.log(err)
            this.props.asyncTaskError("Unable to load recently added albums")
        }
    }

    render() {
        const albums = this.state.albums
        return (
            <Grid fluid style={{padding: "20px"}}>
                <Row>
                    <Col md={24} lg={24}>
                        <h1 style={{fontWeight:"bold", display: "inline-block"}}>Recently Added</h1>
                    </Col>
                    <Col md={24} className="result-grid-container" >
                        { albums.map(a => 
                            <div key={a.id} className="result-item">
                                <AlbumResult album={a} />
                            </div>
                        )}
                    </Col>
                </Row>
            </Grid>
        )
    }
}

RecentlyAddedView.propTypes = {
    beginAsyncTask: PropTypes.func,
    asyncTaskSuccess: PropTypes.func,
    asyncTaskError : PropTypes.func,
}

RecentlyAddedView.defaultProps = {
    beginAsyncTask: () => null,
    asyncTaskSuccess: () => null,
    asyncTaskError : () => null,
}
