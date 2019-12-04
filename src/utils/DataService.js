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

export function fileUpload(file, riskfree, filetype){
  const formData = new FormData();
  formData.append('the_file', file)
  formData.append('riskfree', riskfree)

  return fetch(filetype, {
    method: 'post',
    body: formData
  })
      .then(handleErrors)
      .then(response =>{
        return response.json()
      })
}
