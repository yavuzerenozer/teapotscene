/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
 
    var canvas;
    var gl;
 
    var rotateSpeed = 1;
    var rotateX = 0;
    var rotateY = 0.1;
    var rotateZ = 0;
      
    var isLocked = 0;
      
    var rotation = [-0.50, -0.75, 2.00];
    
    var RGBPosition;
    var spinningPosition;
      
    var tempModelMatrix;
    
    var plane_vertices = [      //TRIANGLE STRIP
        //  X,  Y,  Z,   
        -2.5, -0.1,  2.5,
        -2.5, -0.1, -2.5,
         2.5, -0.1,  2.5,
         2.5, -0.1, -2.5,
        -2.5, -0.1, -2.5,  
        
    ];



    var fieldOfView = 45.0;
  
    var aspect;
    var zNear = 0.01;
    var zFar = 20.0;      
      
    var camPosX = -0.5;
    var camPosY = -0.75;
    var camPosZ = 2.00;  
      
    var program;
      
    var scene;



function createProgram(gl, shaderSpecs) {
      var program = gl.createProgram();
      for ( var i = 0 ; i < shaderSpecs.length ; i++ ) {
        var spec = shaderSpecs[i];
        var shader = gl.createShader(spec.type);
        gl.shaderSource(
          shader, document.getElementById(spec.container).text
        );
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          throw gl.getShaderInfoLog(shader);
        }
        gl.attachShader(program, shader);
        gl.deleteShader(shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw gl.getProgramInfoLog(program);
      }
      return program;
    }      

function loadMeshData(string) {
      var lines = string.split("\n");
      var positions = [];
      var vertices = [];
 
      for ( var i = 0 ; i < lines.length ; i++ ) {
        var parts = lines[i].trimRight().split(' ');
        if ( parts.length > 0 ) {
          switch(parts[0]) {
            case 'v':  positions.push(
              vec3.fromValues(
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
              ));
      
              break;
            case 'f': {
              var f1 = parts[1];
              var f2 = parts[2];
              var f3 = parts[3];
              Array.prototype.push.apply(
                vertices, positions[parseInt(f1)-1]);             
              Array.prototype.push.apply(
                vertices, positions[parseInt(f2)-1]);              
              Array.prototype.push.apply(
                vertices, positions[parseInt(f3)-1]);
              
              break;
            }
          }
        }
        }
      console.log(
        "Loaded mesh with " + (vertices.length /6) + " vertices");
      return {
        primitiveType: 'TRIANGLES',
        vertices: new Float32Array(vertices),
        vertexCount: vertices.length,
      };
    }
 
function loadMesh(filename) {
      $.ajax({
        url: filename,
        dataType: 'text'
      }).done(function(data) {
        init(loadMeshData(data));
      }).fail(function() {
        alert('Faild to retrieve [' + filename + "]");
      });
    }    

function radToDeg(r) {
    return r * 180 / Math.PI;
  }

function degToRad(d) {
    return d * Math.PI / 180;
  }
  
function lookAt(eye, center, up) {
  let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  let eyex = eye[0];
  let eyey = eye[1];
  let eyez = eye[2];
  let upx = up[0];
  let upy = up[1];
  let upz = up[2];
  let centerx = center[0];
  let centery = center[1];
  let centerz = center[2];

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }
  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  return [
      x0, y0, z0, 0,
      x1, y1, z1, 0,
      x2, y2, z2, 0,
      -(x0 * eyex + x1 * eyey + x2 * eyez), -(y0 * eyex + y1 * eyey + y2 * eyez), -(z0 * eyex + z1 * eyey + z2 * eyez), 1
  ];
}

function translate(out, a, v) {
  let x = v[0], y = v[1], z = v[2];
  let a00, a01, a02, a03;
  let a10, a11, a12, a13;
  let a20, a21, a22, a23;
  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];
    out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
    out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
    out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }
  return out;
}

function rotateXfunc(out, a, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  let a10 = a[4];
  let a11 = a[5];
  let a12 = a[6];
  let a13 = a[7];
  let a20 = a[8];
  let a21 = a[9];
  let a22 = a[10];
  let a23 = a[11];
  if (a !== out) { // If the source and destination differ, copy the unchanged rows
    out[0]  = a[0];
    out[1]  = a[1];
    out[2]  = a[2];
    out[3]  = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  // Perform axis-specific matrix multiplication
  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}

function rotateYfunc(out, a, rad) {
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  let a00 = a[0];
  let a01 = a[1];
  let a02 = a[2];
  let a03 = a[3];
  let a20 = a[8];
  let a21 = a[9];
  let a22 = a[10];
  let a23 = a[11];
  if (a !== out) { // If the source and destination differ, copy the unchanged rows
    out[4]  = a[4];
    out[5]  = a[5];
    out[6]  = a[6];
    out[7]  = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  // Perform axis-specific matrix multiplication
  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}
  
function resize(width, height, gl){
    if(height == 0) height == 1;
    
    var aspect = width / height;
    var fieldOfView = 45.0;
    var zNear = 0.01;
    var zFar = 20.0;
    
    mat4.perspective(
        scene.projectionMatrix, degToRad(fieldOfView), aspect,
        zNear, zFar);  // matrix, FOV, aspect, zNear, zFar
        
    gl.viewport(0, 0, width, height);
    
}

function lockChangeAlert() {
  if (document.pointerLockElement === canvas ||
      document.mozPointerLockElement === canvas) {
    console.log('The pointer lock status is now locked');
    document.addEventListener("mousemove", updatePosition, false);
  } else {
    console.log('The pointer lock status is now unlocked');
    document.removeEventListener("mousemove", updatePosition, false);
  }
}
 
function updatePosition(e) {
    
    //camPosY += e.movementX/1000;
    //camPosX += e.movementY/1000;
   /* 
    if(e.movementX > 0){

        scene.rotationMatrix = [
            Math.cos(rotation[1]), 0, -Math.sin(rotation[1]), 0,
            0, 1, 0, 0,
            Math.sin(rotation[1]), 0, Math.cos(rotation[1]), 0,
            0, 0, 0, 1
        ];
        console.log(rotation[1])
        //camPosY += 0.01;
    }
    else if(e.movementX < 0){
        scene.rotationMatrix = [
            Math.cos(rotation[0]), 0, Math.sin(rotation[0]), 0,
            0, 1, 0, 0,
            -Math.sin(rotation[0]), 0, Math.cos(rotation[0]), 0,
            0, 0, 0, 1
        ];
        //camPosY -= 0.01;
    }
    else if(e.movementY > 0){
        scene.rotationMatrix = [
            1, 0, 0, 0,
            0, Math.cos(e.movementY), -Math.sin(e.movementY), 0,
            0, Math.sin(e.movementY), Math.cos(e.movementY), 0,
            0, 0, 0, 1  
        ];
        //camPosX += 0.01;
    }
    else if(e.movementY < 0){
        scene.rotationMatrix = [
            1, 0, 0, 0,
            0, Math.cos(e.movementY), -Math.sin(e.movementY), 0,
            0, Math.sin(e.movementY), Math.cos(e.movementY), 0,
            0, 0, 0, 1  
        ];
        //camPosX -= 0.01;
    
    }   */
} 
       
function init(object) {
 
 
    canvas = document.getElementById('rendering-canvas');
    gl = canvas.getContext('webgl2');
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);     
    gl.cullFace(gl.BACK);      
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
      

    aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  

    program = createProgram(
        gl,
        [{container: 'vertex-shader', type: gl.VERTEX_SHADER},
         {container: 'fragment-shader', type: gl.FRAGMENT_SHADER}]);
 
    gl.useProgram(program);
 
    
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'pos'));
      
 
    var vertexBuffer = gl.createBuffer();
 
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    
    gl.bufferData(gl.ARRAY_BUFFER, (object.vertices.length + plane_vertices.length) * Float32Array.BYTES_PER_ELEMENT, gl.STATIC_DRAW);
      
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(plane_vertices), 0);
    gl.bufferSubData(gl.ARRAY_BUFFER, plane_vertices.length * Float32Array.BYTES_PER_ELEMENT, new Float32Array(object.vertices), 0)
        
        
    
    gl.vertexAttribPointer(
        gl.getAttribLocation(program, 'pos'), 
        3, 
        gl.FLOAT, 
        gl.FALSE, 
        Float32Array.BYTES_PER_ELEMENT * 3, 
        0
        );
        
    
    RGBPosition = gl.getUniformLocation(program, 'RedGreenBlue');    
        
    spinningPosition = gl.getUniformLocation(program, 'spinning');       
    
        
        
        
 
      var projectionMatrix = mat4.create();
      mat4.perspective(
        projectionMatrix, degToRad(fieldOfView), aspect,
        zNear, zFar);  // matrix, FOV, aspect, zNear, zFar
      program.projectionMatrixUniform = gl.getUniformLocation(
        program, 'projectionMatrix');


      var viewMatrix = mat4.create();
      program.viewMatrixUniform = gl.getUniformLocation(
        program, 'viewMatrix');
        
      var rotationMatrix = mat4.create();
      program.rotationMatrixUniform = gl.getUniformLocation(
        program, 'rotationMatrix');
        
        
        gl.uniformMatrix4fv(
        program.projectionMatrixUniform, gl.FALSE, 
        projectionMatrix);
        
            
        gl.uniformMatrix4fv(
        program.viewMatrixUniform, gl.FALSE, viewMatrix);

        gl.uniformMatrix4fv(
        program.rotationMatrixUniform, gl.FALSE, rotationMatrix);



      var modelMatrix = mat4.create();
      mat4.identity(modelMatrix);
      mat4.translate(modelMatrix, modelMatrix, [0, 0, -4]);
      
           var tempModelMatrix = mat4.create();
      mat4.identity(tempModelMatrix);
      mat4.translate(tempModelMatrix, tempModelMatrix, [0, 0, -4]); 
      
        program.modelMatrixUniform = gl.getUniformLocation(
        program, 'modelMatrix');
      gl.uniformMatrix4fv(
        program.modelMatrixUniform, gl.FALSE, modelMatrix);
 
      object.modelMatrix = modelMatrix;
      object.tempModelMatrix = tempModelMatrix;
      object.vertexBuffer = vertexBuffer;
 
         program.tempModelMatrixUniform = gl.getUniformLocation(
        program, 'tempModelMatrix');
      gl.uniformMatrix4fv(
        program.tempModelMatrixUniform, gl.FALSE, tempModelMatrix);
 
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.useProgram(null);
     
    
      scene = {
        program: program,
        object: object,
        start: Date.now(),
        projectionMatrix: projectionMatrix,
        viewMatrix: viewMatrix,
        rotationMatrix: rotationMatrix
      };
 

          window.onkeydown = function( event ) {
        var key = event.keyCode;
        if(key == 107){
            rotateSpeed *= 1.5;
            
        }
        else if(key == 109){
            rotateSpeed /= 1.5;    
        }
        else if(key == 38){
            camPosZ += 0.08;    
            
        }
        else if(key == 40){
            camPosZ -= 0.08;    
            
        }
        else if(key == 37){
            camPosX -= 0.08;    
            
        }
        else if(key == 39){
            camPosX += 0.08;    
            
        }
        else if(key == 105){
            camPosY += 0.08;    
            
        }
        else if(key == 99){
            camPosY -= 0.08;    
            
        }
        else if(key == 69 && isLocked == 0){ // Pointer lock
            isLocked = 1;
            canvas.requestPointerLock();
            document.addEventListener('pointerlockchange', lockChangeAlert, false);
            document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
            document.addEventListener('webkitpointerlockchange', lockChangeAlert, false);
        }
        
        else if(key == 69 && isLocked == 1){
            isLocked = 0;
            document.exitPointerLock();
            document.removeEventListener("mousemove", updatePosition, false);
        }
        
        
        };
      
      requestAnimationFrame(function(timestamp) {
      render(gl, scene, timestamp, 0);
      });
    }
 
function render(gl,scene,timestamp,previousTimestamp) {
 
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(scene.program);
        
        rotateY = 0.1;
        delta = rotateSpeed * (0.125 * Math.PI) / (timestamp - previousTimestamp);        
        scene.program.projectionMatrixUniform = gl.getUniformLocation(
        scene.program, 'projectionMatrix');
        
        var cameraPosition = [
        0.0,
        -0.5,
       1
        ];
        
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        
        
        scene.viewMatrix = lookAt(cameraPosition, target, up);
       
        scene.program.rotationMatrixUniform = gl.getUniformLocation(
        scene.program, 'rotationMatrix');
        

        
              gl.uniformMatrix4fv(
        scene.program.modelMatrixUniform, gl.FALSE,
        scene.object.modelMatrix);       
        
        
            gl.uniformMatrix4fv(
        scene.program.projectionMatrixUniform, gl.FALSE, 
        scene.projectionMatrix);
        
            
                gl.uniformMatrix4fv(
        scene.program.viewMatrixUniform, gl.FALSE, 
        scene.viewMatrix);
        
                gl.uniformMatrix4fv(
        scene.program.rotationMatrixUniform, gl.FALSE, 
        scene.rotationMatrix);
      
      
 
 
 
        gl.uniform3f(RGBPosition, 0.2, 0.2, -0.4);
        gl.uniform1f(spinningPosition, 1.0);
    
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, plane_vertices.length/3);
  
        gl.uniform3f(RGBPosition, 0.0, 0.0, 0.0);
        gl.uniform1f(spinningPosition, 0.0);
        
        gl.drawArrays(gl.TRIANGLES, plane_vertices.length/3, scene.object.vertexCount);

mat4.rotate(
        scene.object.modelMatrix, scene.object.modelMatrix, delta,
        [rotateX, rotateY, rotateZ]);
      gl.uniformMatrix4fv(
        scene.program.modelMatrixUniform, gl.FALSE,
        scene.object.modelMatrix);
      /*gl.bindBuffer(gl.ARRAY_BUFFER, scene.object.vertexBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, scene.object.vertexCount);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.useProgram(null);*/
      
    
        requestAnimationFrame(function(time) {
        render(gl,scene,time,timestamp);
        
      });
    }
    
    
    
    
 
$(document).ready(function() {
      loadMesh('teapot.smf')
    });




    