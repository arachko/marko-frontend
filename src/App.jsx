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

  pollServerForResult(uuid) {

    setTimeout(() => {

      pollServer(uuid).then((json) => {
        if (doesJsonHaveExpectedContent(json)) {
          logErrorJson(json);
          this.setState({
            data: json,
            loading: false,
            riskFree: json.CML.OptimalPorfolio.riskfree_ret
          })
        }
        else if (json.response && json.response.taskexists === false) {
          this.setState({
            error: true,
            loading: false
          })
        }
        else {
          this.pollServerForResult(uuid)
        }
      })
    }, 10000)
  }

  changePage = (page) => () => {
    this.setState({
      page: page
    })
  };

  selectPoint = (point) => {
    this.setState({point: point})
  };

  getPieChartButton = () => {
    if (this.state.point == null) {
      return <button onClick={this.changePage('portfolio')} disabled className="btn btn-success">Let's view your portfolio</button>
    } else {
      return <button onClick={this.changePage('portfolio')} className="btn btn-success">Let's view your portfolio</button>
    }
  };

  setJson = (content) => {
    this.setState({jsonFile: content});
  };

  render() {
    if (this.state.page === 'start') {
      return <StartPage changePage={this.changePage}/>
    } else if (this.state.page === 'calculation') {
      return <CalculationPage
          state={this.state}
          toPieChartButton={this.getPieChartButton}
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
