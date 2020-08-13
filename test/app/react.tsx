/* @jsx React.createElement */
// @ts-nocheck
import React from 'react'

export default class WebApp extends React.Component<{}, {message: string}> {
  public constructor (props) {
    super(props)
    this.state = { message: 'default' }
  }

  private hello (): void {
    this.setState({ message: 'hello browser-monkey' })
  }

  public render (): React.ReactNode {
    return <div>
      <button onClick={() => this.hello()}>press me</button>
      <input type="text" onChange={(e) => this.setState({message: e.target.value})}/>
      <div className='message'>{this.state.message}</div>
    </div>
  }
}
