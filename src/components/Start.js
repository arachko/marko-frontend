import React, { Component } from 'react';

class StartPage extends Component{

    render() {
        const { changePage } = this.props;
        return (
            <div className="App bg-dark">
                <header className="App-header">
                    <div>
                        <h3>
                            Build your portfolio based on Markowitz analysis<br />
                            <small className="text-muted">description for your program</small>
                        </h3>
                    </div>
                    <div>
                        <button className="btn btn-light btn-lg mt-5" onClick={changePage('calculation')}>
                            Let's start
                        </button>
                    </div>
                </header>
            </div>
        );
    }
}

export default StartPage