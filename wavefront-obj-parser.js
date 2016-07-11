module.exports = WaveFrontToJson
var vertexInfoNameMap = {v: 'vertex', vt: 'uv', vn: 'normal'}
function WaveFrontToJson (wavefrontString) {
  var parsedJSON = { vertex: [], normal: [], uv: [], indices: [] };
  var aux = { vertex: [], normal: [], uv: [] };
  var aux2 = { hashindices: {}, index: 0 };

  var lines = wavefrontString.split('\n');

  var FACE_RE = /^f\s/;
  var WHITESPACE_RE = /\s+/;
  var vertexInfoType, line, elems;

  for (var i = 0; i < lines.length; i++) {
    line = lines[i].trim();
    elems = line.split(WHITESPACE_RE);
    vertexInfoType = vertexInfoNameMap[elems[0]];
    if (vertexInfoType) {
      aux[vertexInfoType] = aux[vertexInfoType].concat(elems.slice(1));
    } else if (FACE_RE.test(line)) {
      elems.shift();
      var newFace = false;
      for (var j = 0, eleLen = elems.length; j < eleLen; j++){
        // Triangulating newFaces
        if(j === 3 && !newFace) {
          // add v2/t2/vn2 in again before continuing to 3
          j = 2;
          newFace = true;
        }
        if(elems[j] in aux2.hashindices){
          parsedJSON.indices.push(aux2.hashindices[elems[j]]);
        } else{
          var vertex = elems[j].split( '/' );
          // vertex position
          parsedJSON.vertex.push(parseFloat(aux.vertex[(vertex[0] - 1) * 3 + 0]));
          parsedJSON.vertex.push(parseFloat(aux.vertex[(vertex[0] - 1) * 3 + 1]));
          parsedJSON.vertex.push(parseFloat(aux.vertex[(vertex[0] - 1) * 3 + 2]));
          // vertex uv
          if (aux.uv.length) {
            parsedJSON.uv.push(parseFloat(aux.uv[(vertex[1] - 1) * 2 + 0]));
            parsedJSON.uv.push(parseFloat(aux.uv[(vertex[1] - 1) * 2 + 1]));
          }
          // vertex normals
          parsedJSON.normal.push(parseFloat(aux.normal[(vertex[2] - 1) * 3 + 0]));
          parsedJSON.normal.push(parseFloat(aux.normal[(vertex[2] - 1) * 3 + 1]));
          parsedJSON.normal.push(parseFloat(aux.normal[(vertex[2] - 1) * 3 + 2]));
          // add the newly created vertex to the list of indices
          aux2.hashindices[elems[j]] = aux2.index;
          parsedJSON.indices.push(aux2.index);
          
          aux2.index += 1;    // increment the counter
        }
        if(j === 3 && newFace) {
          // add v0/t0/vn0 onto the second triangle
          parsedJSON.indices.push( aux2.hashindices[elems[0]]);
        }
      }
    }
  }

  return parsedJSON;
}
