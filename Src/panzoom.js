
class PanZoom {
  constructor() {
    this.zoom = 1;
    this.xoff = 0;
    this.yoff = 0;
    this.rot = 0;
    this.mouse = { x: 0, y: 0 };
    this.zoomToMouse = true;
    this.ignoreInput = false;
  }
  
  setInView(x, y) {
    this.xoff = -x;
    this.yoff = -y;
  }
  
  setRotation(rad) {
    this.rot = rad;
  }
  
  scaleCoordinate(x, y) {
    return {
      x: ((x - width / 2) / this.zoom + width / 2) - this.xoff,
      y: ((y - height / 2) / this.zoom + height / 2) - this.yoff
    };
  }

  unScaleCoordinate(x, y) {
    // const cX = (x + this.xoff - width / 2) * this.zoom;
    // const cY = (y + this.yoff - height / 2) * this.zoom;

    // Rotate points
    // let x2 = (x + width/2)

    // return {
    //   x: (x + this.xoff - width / 2) * this.zoom + width / 2,
    //   y: (y + this.yoff - height / 2) * this.zoom + height / 2,
    // }
  }
  
  updateMouse() {
    const pos = this.scaleCoordinate(mouseX, mouseY);
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
  }
  
  begin(ctx) {
    if (ctx) {
      ctx.push()
      ctx.translate(width/2, height/2);
      ctx.scale(this.zoom);
      ctx.rotate(this.rot);
      ctx.translate(this.xoff, this.yoff);
    } else {
      push()
      translate(width/2, height/2);
      scale(this.zoom);
      rotate(this.rot);
      translate(this.xoff, this.yoff);
    }
    
  }
  
  end(ctx) {
    if (ctx) {
      ctx.pop();
    } else {
      pop();
    }
  }
  
  zoomIn(amt) {
    // Store old
    let zoom = this.zoom;
    let xoff = this.xoff;
    let yoff = this.yoff;
    
    // Calculate new
    const dmx = (width / 2) - mouseX;
    const dmy = (height / 2) - mouseY;
    if (this.zoomToMouse) {
      xoff += dmx * amt / zoom
      yoff += dmy * amt / zoom
    }
    zoom /= 1 - amt
    
    // Update
    this.zoom = zoom;
    this.xoff = xoff;
    this.yoff = yoff;
  }
  
  zoomOut(amt) {
    // Store old
    let zoom = this.zoom;
    let xoff = this.xoff;
    let yoff = this.yoff;
    
    // Calculate new
    const dmx = (width / 2) - mouseX
    const dmy = (height / 2) - mouseY
    zoom *= 1 - amt
    if (this.zoomToMouse) {
      xoff -= dmx * amt / zoom
      yoff -= dmy * amt / zoom
    }
    
    // Update
    this.zoom = zoom;
    this.xoff = xoff;
    this.yoff = yoff;
  }
  
  displayLines() {
    this.begin();
    const TL = this.scaleCoordinate(0, 0);
    const BR = this.scaleCoordinate(width, height);
    const GAP = 20;
    const inset = 4 / this.zoom;
    
    stroke(50);
    strokeWeight(1 / this.zoom);
    for (let x = floor(TL.x / GAP) * GAP; x <= BR.x; x += GAP)
      line(x, TL.y, x, BR.y);
    
    this.end();
  }
}

/*



















*/
