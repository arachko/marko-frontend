import fetch from 'isomorphic-fetch';

export const allowedFileTypes = ["text/csv"];
export const allowedJsonTypes = ["application/json"]

export function fileIsIncorrectFileType(file) {
  return (allowedFileTypes.indexOf(file.type) === -1)
}

export function fileIsIncorrectJsonType(file) {
  return (allowedJsonTypes.indexOf(file.type) === -1)
}

export function showInvalidFileTypeMessage(allowedType){
  window.alert("Tried to upload invalid filetype. Only " + allowedType + " is allowed");
}

export function getData(riskfree, stocks, source) {
  const url = `/ef?source=` + source + `&symbols=` + stocks +`&riskfree=` + riskfree
  return fetch(url)
      .then(handleErrors)
      .then(response =>{
        return response.json()
      })
}

export function pollServer(uuid) {
  const url = `/getasynctaskresult?uuid=` + uuid
  return fetch(url)
    .then(handleErrors)
    .then(response =>{
      return response.json()
    })
}

function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

export function doesJsonHaveExpectedContent(json) {
  return (json != null && json.EfficientPortfolios != null && json.CML != null)
}

export function doesJsonHaveError(json) {
  return (json != null && ((json.EfficientPortfolios != null && json.EfficientPortfolios.error)
      || (json.CML != null && json.CML.error)))
}

export function logErrorJson(json) {
  if(doesJsonHaveError) {
    console.log(json)
  }
}


const pointRequest = (riskFree, fileName, resolve) => {
    let body = {
        "expected_returns_calc": "mean",
        "portfolio2return": "sharpe",
        "risk_free": riskFree,
        "target_return": null,
        "target_volatility": null,
        "lower_weight_bound": 0,
        "higher_weight_bound": 1,
        "market_neutral": false,
        "url": fileName,
        "to_cache": null,
        "reuse_cache": null,
        "cache_key": null,
        "no_cache_calculation": true,
        "portfolio_value": 100000,
        "min_allocation": 0.01,
        "min_value": 1,
        "allocation_cutoff": 0.0001,
        "gamma": 0
    };
    let url = 'http://127.0.0.1:5000/portfolio-point';
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(body)
    })
        .then( result => {

            return result.json()
        })
        .then(result =>  {
            console.log(result)
            resolve ( result )
        })
};


const parsePoints = (points) => {
    let retVal = {
        CML: {
            OptimalPortfolio: {
                OP: {
                    Portfolio:{}
                }
            }
        },
        EfficientPortfolios: {
            Points: []
        }
    };
    for (let i = 0; i < points.length; i++) {
        retVal.EfficientPortfolios.Points.push(points[i].point);
        if (points[i].risk_free === 0.05) {
            retVal.CML.OptimalPortfolio.OP.Portfolio = Object.assign({}, points[i].point);
            retVal.CML.OptimalPortfolio.OP.Portfolio.weights = points[i].portfolio;
            retVal.CML.OptimalPortfolio.OP.Portfolio.name = 'testtest' ;
            retVal.CML.OptimalPortfolio.opt_ret = parseFloat(points[i].point.return.toFixed(3));
            retVal.CML.OptimalPortfolio.opt_vol = parseFloat(points[i].point.volatility.toFixed(3));
            retVal.CML.OptimalPortfolio.riskfree_ret = points[i].risk_free;
        }
    }
    return retVal
};


const uploadFileRequest = (file, fileName, riskFreeArr, resolve) => {
    let url = 'http://127.0.0.1:5000/upload-file/' + fileName;
    fetch(url, {
        method: 'POST',
        body: file
    })
        .then( result => {
            return result.json()
        })
        .then(result =>  {
            let pointsPromises = [];
            for (let i = 0; i < riskFreeArr.length; i++){
                pointsPromises.push(
                    new Promise((resolve, reject) => {
                        pointRequest(riskFreeArr[i], result.file_name, resolve)
                    })
                )
            }
            Promise.all(pointsPromises).then(points => {
                console.log(points)
                const ret = parsePoints(points);
                resolve(ret);


            });

        });
};


const processFile = (file, riskFreeArr, resolve) => {
    let fr = new FileReader();
    fr.readAsArrayBuffer(file);
    fr.onload = (e) => {
        return uploadFileRequest(e.target.result, file.name, riskFreeArr, resolve)
    };
};


export const fileUpload = (file) => {
    let risKFreePoints = [0.01];
    for (let i = 0; i < 20; i++) {
        risKFreePoints.push(risKFreePoints[risKFreePoints.length-1] + 0.01)
    }
    return new Promise((resolve, reject) => {
        processFile(file, risKFreePoints, resolve)
    })
};

