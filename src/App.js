import React, { Component } from 'react'
import shuffle from 'shuffle-array'
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
        const hasNextPage = data.graphql.hashtag.edge_hashtag_to_media.page_info.has_next_page
        const topEdges = data.graphql.hashtag.edge_hashtag_to_top_posts.edges.filter((item) => item.node.is_video)
        const edges = data.graphql.hashtag.edge_hashtag_to_media.edges.filter((item) => item.node.is_video)
        if (topEdges.length === 0 && edges.length === 0 && hasNextPage) {
          this.setState({
            hasNextPage: hasNextPage,
            maxId: data.graphql.hashtag.edge_hashtag_to_media.page_info.end_cursor,
          })
          return this.request()
        }
        
        this.setState({
          hasNextPage: hasNextPage,
          maxId: data.graphql.hashtag.edge_hashtag_to_media.page_info.end_cursor,
          edges: shuffle(this.state.edges.concat(topEdges, edges))
        }, () => {
          if (this.state.edges.length > 0) {
            this.loadVideo()
          } else {
            this.setState({
              loading: false,
              error: { description: 'Videos are not found, please try other hashtag' }
            })
          }
        })
      })
      .catch(() => {
        this.setState({
          loading: false,
          error: { description: 'Videos are not found, please try other hashtag' }
        })
      })
  }

  loadVideo() {
    let currentIndex = this.state.currentIndex
    if (!this.state.edges[this.state.currentIndex]) {
      currentIndex = 0
    }
    const shortcode = this.state.edges[currentIndex].node.shortcode
    fetch(`https://www.instagram.com/p/${shortcode}/?__a=1`)
    .then((response) => response.json())
    .then((data) => {
      this.setState({
        currentIndex: currentIndex,
        loading: false,
        videoUrl: data.graphql.shortcode_media.video_url
      }, () => {
        window.location.hash = data.graphql.shortcode_media.owner.username
        window.scrollTo(0, window.innerHeight)
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
        { this.state.loading &&
          <div className="loader"/>
        }

        { !this.state.videoUrl &&
          <div className="container">
            <h1>Watch Instagram videos non stop!</h1>
            <h2>Type a hashtag and enjoy</h2>
            <form onSubmit={(e) => this.onSubmit(e)}>
              <input type="text" ref={(input) => { this.tagInput = input }} placeholder="hashtag"/>
              <button type="submit">Search videos</button>
            </form>
            { this.state.error &&
              <h3 className="error">{this.state.error.description}</h3>
            }
          </div>
        }
        <br/>
        { this.state.videoUrl &&
          <video controls="true" className="video" src={this.state.videoUrl} autoPlay="true" onEnded={() => this.next()}/>
        }
      </div>
    )
  }
}

export default App
