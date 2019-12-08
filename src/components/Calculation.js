import React, { Component } from "react";
import {parseGroupingBy} from "../utils/Parser";
import LineChart from "react-linechart";
import * as d3 from "d3";
import {
    allowedFileTypes, allowedJsonTypes, doesJsonHaveExpectedContent,
    fileIsIncorrectFileType, fileIsIncorrectJsonType,
    fileUpload,
    logErrorJson,
    showInvalidFileTypeMessage
} from "../utils/DataService";

class CalculationPage extends Component{
    state = {
        riskFree: 0.05,
        point: null
    };

    onClickLineChart = () => (event, point) => {
        this.props.selectPoint(point);
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

    getLoadingMessage() {
        setTimeout(() => this.updateMinutes(), 60000);
        if (this.state.minutes === 0) {
            return "Processing request..."
        } else if (this.state.minutes === 1) {
            return "So far it has taken 1 minute, still processing..."
        } else {
            return "So far it has taken " + this.state.minutes + " minutes, still processing..."
        }
    }

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

    updateFileType = () => (e) => {
        console.log(e.target.value);
        this.setState({filetype:e.target.value})
    };


    jsonFileChange = () => (e) => {
        const { setJson } = this.props;
        let file = e.target.files[0];
        if (file == null || fileIsIncorrectJsonType(file)) {
            showInvalidFileTypeMessage(allowedJsonTypes)
        } else {
            let reader = new FileReader();
            reader.onload = function (evt) {
                setJson(evt.target.result);
            };
            reader.readAsText(file)
        }
    };

    downloadSinglePoint = () => () => {
        const { state } = this.props;
        if (state.point && state.point !== '') {
            let pointSaved = state.point;
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
        const { state } = this.props;
        if (state.data !== '') {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.data, null, 2));
            let downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "export.json");
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
    };


    uploadJson = () => (e) => {
        const { state } = this.props;
        e.preventDefault();
        let jsonfile = JSON.parse(state.jsonFile);
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

    updateCml = () => (e) => {
        if (e.target.value > 0.3 || e.target.value < 0) {
            window.alert("Please enter a value between 0 and 0.3");
        }
        else {
            this.setState({riskFree: Number(e.target.value)})
        }
    };

    componentDidMount() {
        this.setState({data: this.props.state.data, point: this.props.state.point})
    }

    getPieChartButton = () => {
        const { changePage } = this.props;
        if (this.state.point == null) {
            return <button onClick={changePage('portfolio')} disabled className="btn btn-success">Let's view your portfolio</button>
        } else {
            return <button onClick={changePage('portfolio')} className="btn btn-success">Let's view your portfolio</button>
        }
    };

    render() {
        const { state } = this.props;
        if (state.loading) {
            return <h2>{this.getLoadingMessage()}</h2>
        }

        if (state.error) {
            return <h2>Received an error from server...</h2>;
        }

        let portfolios;
        let tangentPoint;
        let riskfreeValue;


        if (this.state.data === undefined) {
            portfolios = state.data.EfficientPortfolios.Points;
            tangentPoint = state.data.CML.OptimalPorfolio.OP.Portfolio;
            riskfreeValue = state.data.CML.OptimalPorfolio.riskfree_ret;
        } else {
            portfolios = this.state.data.EfficientPortfolios.Points;
            tangentPoint = this.state.data.CML.OptimalPorfolio.OP.Portfolio;
            riskfreeValue = this.state.data.CML.OptimalPorfolio.riskfree_ret;
        }


        const riskfreePoint = {
            volatility: 0,
            return: riskfreeValue,
            name: tangentPoint.name
        };


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
            <div className="bg-dark">
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
                                                yMin={0}
                                                xDisplay={d3.format(".2f")}
                                                onPointHover={this.onHoverLineChart}
                                                onPointClick={this.onClickLineChart()}
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
                                                    <select value={state.fileType} onChange={this.updateFileType()} className="form-control">
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
                        <div className="card">
                            <div className="card-header h4">Your Diagram</div>
                            <div className="button-container card-body">
                                <div className="cml form-group my-2">
                                    <label htmlFor="CML">CML:</label>
                                    <input id="CML" className="form-control" type="number" defaultValue={state.riskFree} min="0" max="0.3" step="0.001" onChange={this.updateCml()} />
                                </div>
                                <div className="single-dl-button mt-4">
                                    <button onClick={this.downloadSinglePoint()} className="btn btn-outline-dark">Export Selected Point Only</button>
                                </div>
                                <div className="download-button mt-4">
                                    <button onClick={this.downloadObjectAsJson()} className="btn btn-outline-dark">Export Whole Analysis as JSON</button>
                                </div>
                                <div className="download-button mt-4">
                                    {this.getPieChartButton()}
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
            </div>
        );
    }
}

export default CalculationPage