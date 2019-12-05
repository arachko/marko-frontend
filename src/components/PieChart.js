import React, { Component } from "react";
import PieChart from 'react-minimal-pie-chart';

class PieChartPage extends Component {

    render() {
        const { point, changePage } = this.props;
        let colorsDiversity = ['#517f11', '#215111', '#1a7111', '#6f7111'];
        let colors = [];
        for(let i=0; i<10; i++) {colors.push(...colorsDiversity)}
        let weights = [];
        for (let i = 0; i < point.weights.length; i++) {
            if (point.weights[i].weight > 0) {
                weights.push(point.weights[i])
            }
        }

        const data = weights.map((weight) => {
            return {title: weight.symbol, value: weight.weight, color: colors[weights.indexOf(weight)]}
        });
        console.log(data);

        const getData = (data) => {
            return data.map((weight) => {
                return <div key={weight.title}>
                    <div>
                        Title: {weight.title}
                    </div>
                    <div className="mb-3">
                        Percentage: {(weight.value * 100).toFixed(2)}%
                    </div>
                </div>
            })
        };

        return (
            <div className="bg-dark">
                <div className="container py-5 bg-white">
                    <div className="row justify-content-between">
                        <div className="pie col-12 col-md-6">
                            <div className="card">
                                <div className="card-header h4">Diagram</div>
                                <div className="card-body">
                                    <PieChart
                                        data={data}
                                        label={(weight) => {
                                            return `${weight.data[weight.dataIndex].title},
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
                            <div className="mt-4">
                                <button onClick={changePage('calculation')} className="btn btn-success w-50">Choose another</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default PieChartPage