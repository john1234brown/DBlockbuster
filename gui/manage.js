//This will be our javascript handling for the manage tab! and responsible for our interactive interface!
window.manageId;
window.manageType;

function manageCardClicked(id, type, obj){
  window.manageId = id;
  window.manageType = type;
  console.log(obj);
  return window.api.cardClicked(id, type, obj);
}

function removePath(path, t, id, index){
  return window.api.removePath(path, t, id, index);
}