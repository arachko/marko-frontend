import React, { Component } from 'react';
import './App.css';
import '../node_modules/react-linechart/dist/styles.css';
import { logErrorJson, pollServer, doesJsonHaveExpectedContent } from './utils/DataService';
import StartPage from './components/Start.js'
import CalculationPage from './components/Calculation.js'
import PieChartPage from './components/PieChart'
const jsonData = require('./testData/data4.json');

export default class App extends Component {

  state ={
    page: 'start',
    loading: false,
    data: jsonData,
    error: false,
    file: null,
    jsonFile: null,
    riskFree: 0.05,
    point: null,
    fileType: "uploadasync",
    minutes: 0
  };

  changePage = (page) => () => {
    this.setState({
      page: page
    })
  };

  selectPoint = (point) => {
    this.setState({point: point})
  };

  setJson = (content) => {
    this.setState({jsonFile: content});
  };

  setData = (data) => {
    this.setState({data: data});
  }

  render() {
    if (this.state.page === 'start') {
      return <StartPage changePage={this.changePage}/>
    } else if (this.state.page === 'calculation') {
      return <CalculationPage
          state={this.state}
          setData={this.setData}
          changePage={this.changePage}
          selectPoint={this.selectPoint}
          setJson={this.setJson}
      />
    } else if (this.state.page === 'portfolio') {
      return <PieChartPage
          point={this.state.point}
          changePage={this.changePage}
      />
    }

  }

}
