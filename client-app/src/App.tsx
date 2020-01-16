import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import { Header, Icon, List } from 'semantic-ui-react'
 
class App extends Component {
  state  = {
    values: []
  }

  componentDidMount() {
    axios.get('http://localhost:5000/api/values').then(res => {
      this.setState({
        values:res.data
    })
    })
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <Header as='h2' icon>
            <Icon name='settings' />
            Account Settings
            <Header.Subheader>
              Manage your account settings and set e-mail preferences.
            </Header.Subheader>
          </Header>
          <img src={logo} className="App-logo" alt="logo" />
          <List>
          {this.state.values.map((value: any) => (
            <List.Item icon='linkify' key={value.id} content={value.name} />
          ))}
          </List>
        </header>
      </div>
    ); 
  }
}

export default App;
