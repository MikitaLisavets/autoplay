import React, { Component } from 'react'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      error: null,
      edges: [],
      tag: '',
      maxId: '',
      hasNextPage: false,
      currentIndex: 0,
      videoUrl: '',
      loading: false
    }
  }

  request() {
    this.setState({ loading: true, error: null })
    fetch(`https://www.instagram.com/explore/tags/${this.state.tag}/?__a=1&max_id=${this.state.maxId}`)
      .then((response) => response.json())
      .then((data) => {
        const topEdges = data.graphql.hashtag.edge_hashtag_to_top_posts.edges.filter((item) => item.node.is_video)
        const edges = data.graphql.hashtag.edge_hashtag_to_media.edges.filter((item) => item.node.is_video)
        this.setState({
          hasNextPage: data.graphql.hashtag.edge_hashtag_to_media.page_info.has_next_page,
          maxId: data.graphql.hashtag.edge_hashtag_to_media.page_info.end_cursor,
          edges: this.state.edges.concat(topEdges, edges)
        }, () => {
          if (this.state.edges.length > 0) {
            this.loadVideo()
          } else {
            this.setState({
              loading: false,
              error: { description: 'Videos not found' }
            })
          }
        })
      })
      .catch(() => {
        this.setState({
          loading: false,
          error: { description: 'Videos not found' }
        })
      })
  }

  loadVideo() {
    const shortcode = this.state.edges[this.state.currentIndex].node.shortcode
    fetch(`https://www.instagram.com/p/${shortcode}/?__a=1`)
    .then((response) => response.json())
    .then((data) => {
      window.location.hash = data.graphql.shortcode_media.owner.username
      this.setState({
        loading: false,
        videoUrl: data.graphql.shortcode_media.video_url
      })
    })
  }

  next() {
    if (this.state.currentIndex >= this.state.edges.length - 1) {
      if(this.state.hasNextPage) {
        this.setState({ currentIndex: this.state.currentIndex + 1 }, () => {
          this.request()
        })
      } else {
        this.setState({ currentIndex: 0 }, () => {
          this.loadVideo()
        })
      }
    } else {
      this.setState({ currentIndex: this.state.currentIndex + 1 }, () => {
        this.loadVideo()
      })
    }
  }

  onSubmit(e) {
    e.preventDefault()
    if (!this.tagInput.value) return
    this.setState({
      tag: this.tagInput.value.replace(/\s|[#]/g, '')
    }, () => {
      this.request()
    })
  }

  render() {
    return (
      <div className="App">
        { !this.state.videoUrl &&
          <form onSubmit={(e) => this.onSubmit(e)}>
            <input type="text" ref={(input) => { this.tagInput = input }} placeholder="hashtag"/>
            <button type="submit">Search videos</button>
            { this.state.loading &&
            <p>loading...</p>
            }
          </form>
        }
        <br/>
        { this.state.error &&
          <h2>{this.state.error.description}</h2>
        }
        { this.state.videoUrl &&
          <video controls="true" height="640" width="640" src={this.state.videoUrl} autoPlay="true" onEnded={() => this.next()}/>
        }
      </div>
    )
  }
}

export default App
