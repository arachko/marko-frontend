import React, { Component } from 'react';
import './App.css';
import * as d3 from "d3";
import PieChart from 'react-minimal-pie-chart';
import LineChart from 'react-linechart';
import '../node_modules/react-linechart/dist/styles.css';
import { parseGroupingBy } from './utils/Parser';
import {
  fileIsIncorrectFileType, showInvalidFileTypeMessage, fileUpload, logErrorJson,
  pollServer, doesJsonHaveExpectedContent, allowedFileTypes, allowedJsonTypes, fileIsIncorrectJsonType
} from './utils/DataService';

const jsonData = require('./testData/data4.json');

export default class App extends Component {

  state ={
    condition: 'start',
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


  downloadSinglePoint = () => () => {
    if (this.state.point && this.state.point !== '') {
      let pointSaved = this.state.point;
      pointSaved.weights.sort((a,b) => b.weight - a.weight);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pointSaved, null, 2));
      let downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "selected-point.json");
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } else {
      window.alert("Please pick a point to export from the graph first");
    }
  };

  downloadObjectAsJson = () => () => {
    if (this.state.data !== '') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state.data, null, 2));
      let downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "export.json");
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  toPieChart = () => () => {
    this.setState({condition: 'portfolio'})
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

  changeCondition = (condition) => () => {
    this.setState({
      condition: condition
    })
  };

  uploadFormSubmit = () => (e) => {
    e.preventDefault();
    if (this.state.file == null || fileIsIncorrectFileType(this.state.file)) {
      showInvalidFileTypeMessage(allowedFileTypes)
    }
    else {
      this.setState({
        loading: true,
        data: '',
        error: false,
        point: null,
        minutes: 0
      });
      fileUpload(this.state.file, this.state.riskFree, this.state.fileType).then((json) => {
        if (this.state.fileType === "uploadasync") {
          const uuid = json.response.uid;
          this.pollServerForResult(uuid)
        }
        else {
          logErrorJson(json);
          this.setState({
            data: json,
            loading: false,
            riskFree: json.CML.OptimalPorfolio.riskfree_ret
          })
        }
      })
          .catch(error => {
            console.log(error);
            this.setState({
              loading: false,
              error: true
            })
          });
    }
  };

  fileChange = () => (e) => {
    if (e.target.files[0] != null ) {
      this.setState({file: e.target.files[0]})
    }
    else {
      this.setState({file: null})
    }
  };

  uploadJson = () => (e) => {
    e.preventDefault();
    let jsonfile = JSON.parse(this.state.jsonFile);
    if(doesJsonHaveExpectedContent(jsonfile)) {
      this.setState({
        error: false,
        point: null,
        data: jsonfile,
        loading: false,
        riskFree: jsonfile.CML.OptimalPorfolio.riskfree_ret
      })
    } else {
      window.alert("Unexpected json format");
    }
  };

  jsonFileChange = () => (e) => {
    let file = e.target.files[0];
    if (file == null || fileIsIncorrectJsonType(file)) {
      showInvalidFileTypeMessage(allowedJsonTypes)
    } else {
      let that = this;
      let reader = new FileReader();
      reader.onload = function (evt) {
        that.setJson(evt.target.result)
      };
      reader.readAsText(file)
    }
  };

  setJson(content) {
    this.setState({jsonFile: content});
  }

  updateFileType = () => (e) => {
    console.log(e.target.value);
    this.setState({filetype:e.target.value})
  };

  onClickLineChart = () => (event, point) => {
    console.log(point);
    console.log(this);
    this.setState({
      point: point
    })
  };

  onHoverLineChart = obj => {
    return ( `return: ${obj.y}<br />`
        + `deviation: ${obj.x}<br />`
        + `sharpe: ${obj.sharpe}<br />`
        + (obj.weights && obj.weights !== undefined
            ? [].concat(obj.weights).sort((a,b) => b.weight - a.weight)
                .map(item => { return `${item.symbol}: ${item.weight}<br />` }).join('')
            : '')
    )
  };

  pieChart() {

    let colors = ['#E38627', '#C13C37', '#6A2135'];
    let weights = [];
    for (let i = 0; i < this.state.point.weights.length; i++) {
      if (this.state.point.weights[i].weight > 0) {
        weights.push(this.state.point.weights[i])
      }
    }

    const data = weights.map((weight) => {
      return {title: weight.symbol, value: weight.weight , color: colors[weights.indexOf(weight)]}
    });
    console.log(data);

    const getData = (data) => {
      return data.map((weight) => {
        return <div>
          <div>
            Title: {weight.title}
          </div>
          <div className="mb-3">
            Percentage: {(weight.value*100).toFixed(2)}%
          </div>
        </div>
      })
    };

    return(
        <body className="bg-dark">
        <div className="container py-5 bg-white">
          <div className="row justify-content-between">
          <div className="pie col-12 col-md-6">
            <div className="card">
            <div className="card-header h4">Diagram</div>
            <div className="card-body">
            <PieChart
                data={data}
                label={(weight) => {
                  console.log(`${weight.data[weight.dataIndex].title},\n${weight.data[weight.dataIndex].value},\n${weight.data[weight.dataIndex].percentage}%`);
                  return `${weight.data[weight.dataIndex].title},
                          ${weight.data[weight.dataIndex].value.toFixed(2)},
                          ${weight.data[weight.dataIndex].percentage.toFixed(2)}%`
                }}
                labelPosition={70}
                labelStyle={{
                  fill: '#121212',
                  fontFamily: 'sans-serif',
                  fontSize: '3px'
                }}
            />
            <p className="small">Description</p>
            </div>
          </div>
          </div>
            <div className="col-12 col-md-6">
              <div className="card">
                <div className="card-header h4">Your portfolio:</div>
                <div className="card-body">
                  {getData(data)}
                </div>
              </div>
            </div>
          </div>
        </div>
        </body>
    )
  };





  startPage() {
    return (

        <div className="App bg-dark">
          <header className="App-header">
            <div>
              <h3>
                Build your portfolio based on Markowitz analysis<br />
                <small className="text-muted">description for your programm</small>
              </h3>
            </div>
            <div>
              <button className="btn btn-light btn-lg mt-5" onClick={this.changeCondition('calculation')}>
                Let's start
              </button>
            </div>
          </header>
        </div>
    );
  }



  calculationPage() {
    if (this.state.loading) {
      return <h2>{this.getLoadingMessage()}</h2>
    }

    if (this.state.error) {
      return <h2>Received an error from server...</h2>;
    }

    const tangentPoint = this.state.data.CML.OptimalPorfolio.OP.Portfolio;
    const riskfreeValue = this.state.data.CML.OptimalPorfolio.riskfree_ret;

    const riskfreePoint = {
      volatility: 0,
      return: riskfreeValue,
      name: tangentPoint.name
    };

    let portfolios = this.state.data.EfficientPortfolios.Points
    console.log(portfolios);
    const userLineName = "user";

    for (let i = 0; i < portfolios.length; i++) {
      if (portfolios[i].name === tangentPoint.name) {
        portfolios.splice(i, portfolios.length - i);
        break;
      }
    }

    const tangentLineContVolatility = portfolios[portfolios.length - 1].volatility;
    const slope = (tangentPoint.return - riskfreeValue) / tangentPoint.volatility;
    const tangentLineContReturn = slope * tangentLineContVolatility + riskfreeValue;

    const tangentLineContinued = {
      volatility: tangentLineContVolatility,
      return: tangentLineContReturn,
      name: tangentPoint.name
    };

    const userDefinedCML = {
      volatility: 0,
      return: this.state.riskFree,
      name: userLineName
    };

    portfolios.push(riskfreePoint, tangentPoint, tangentLineContinued, userDefinedCML);

    if (this.state.point != null) {

      const userTangentPoint = {
        volatility: this.state.point.x,
        return: this.state.point.y,
        sharpe: this.state.point.sharpe,
        weights: this.state.point.weights,
        name: userLineName
      };

      const userSlope = (this.state.point.y - this.state.riskFree) / this.state.point.x;
      const userContReturn = userSlope * tangentLineContVolatility + this.state.riskFree;

      const userLineContinued = {
        volatility: tangentLineContVolatility,
        return: userContReturn,
        name: userLineName
      };

      portfolios.push(userTangentPoint, userLineContinued)
    }

    let dataParsed = parseGroupingBy(portfolios, "volatility", "return", "name");
    return (
        <body className="bg-dark">
        <div className="container py-5 bg-white">
          <div className="row justify-content-between">


            <div className="col-12 col-md-8">
              <div className="card">
                <div className="card-header h4">Markowitz Analysis</div>

                <div className="card-body">
                  <div className="row">
                    <div className="col-12 border-bottom pb-4">
                      <div className="App">
                        <LineChart
                            width={600}
                            height={400}
                            xLabel="Standard Deviation"
                            yLabel="Expected Return"
                            interpolate="cardinal"
                            pointRadius={2}
                            xMin="0"
                            //xMax="5"
                            yMin={0}
                            xDisplay={d3.format(".2f")}
                            //yMax={1}
                            onPointHover={this.onHoverLineChart}
                            onPointClick={this.onClickLineChart()}
                            //showLegends
                            legendPosition="bottom-right"
                            data={dataParsed}
                        />
                      </div>
                    </div>
                    <div className="col-6 border-right pt-4">
                      <div className="button-header">
                        Upload your history data in CSV format for Markowitz Portfolio Analysis
                      </div>
                      <div className="upload-button mb-3">
                        <form onSubmit={this.uploadFormSubmit()}>
                          <input type="file" onChange={this.fileChange()} className="my-3"/>
                          <label className="file-type">
                            Upload Type:
                            <select value={this.state.fileType} onChange={this.updateFileType()} className="form-control">
                              <option value="uploadasync">uploadasync</option>
                              <option value="upload1">upload1</option>
                              <option value="upload">upload</option>
                            </select>
                          </label>
                          <button type="submit" className="btn btn-outline-dark m-2">Upload csv</button>
                        </form>
                      </div>


                    </div>

                    <div className="col-6 pt-4">
                      <div className="button-header-with-gap">
                        Upload your saved Markowitz Portfolio Analysis in JSON format for quick access
                      </div>
                      <div className="upload-button">
                        <form onSubmit={this.uploadJson()}>
                          <input type="file" onChange={this.jsonFileChange()} className="my-3"/>
                          <button type="submit" className="btn btn-outline-dark my-2">Upload JSON</button>
                        </form>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
            <div className="col-12 col-md-4">
                  <div class="card">
                  <div className="card-header h4">Your Diagram</div>
                  <div className="button-container card-body">
                    <div className="cml form-group my-2">
                      <label htmlFor="CML">CML:</label>
                      <input id="CML" className="form-control" type="number" defaultValue={this.state.riskFree} min="0" max="0.3" step="0.001" onChange={this.updateCml} />
                    </div>
                    <div className="single-dl-button mt-4">
                      <button onClick={this.downloadSinglePoint()} className="btn btn-outline-dark">Export Selected Point Only</button>
                    </div>
                    <div className="download-button mt-4">
                      <button onClick={this.downloadObjectAsJson()} className="btn btn-outline-dark">Export Whole Analysis as JSON</button>
                    </div>
                    <div className="download-button mt-4">
                      <button onClick={this.toPieChart()} className="btn btn-success">pieChart</button>
                    </div>
                  </div>
                  </div>
            </div>
        </div>

          <div className="row mt-3">
            <div className="col-8">

            </div>
          </div>

        </div>
        </body>
    );
  }

  render() {
    if (this.state.condition === 'start') {
      return this.startPage()
    } else if (this.state.condition === 'calculation') {
      return this.calculationPage()
    } else if (this.state.condition === 'portfolio') {
      return this.pieChart()
    }

  }

}
