class Chess {
  constructor(options) {
    this._init(options);
    this.methods.beforeMount.call(this);
     //exist初始化
    if (this.autoCanvas) {
      Chess.build.start.call(this);
    }
    this.methods.mounted.call(this);
    Chess.initExist.call(this);
    this.methods.created.call(this);
  }
}
initMixin(Chess);
buildMixin(Chess);
staticMixin(Chess);

function initMixin(Chess) {
  Chess.prototype._init = function(options) {
    let data = options.data;
    let canvas = options.canvas;
    let id = canvas.el.slice(1) || "cvs";
    this.first = data.first || "black";
    this.line = data.tableLine || 19;
    this.sorted = data.sorted || [];
    this.unsorted_black = data.unsorted_black || [];
    this.unsorted_white = data.unsorted_white || [];
    (this.eatRecord = []), (this.autoCanvas = canvas.auto || false);
    this.canvas = this.autoCanvas
      ? {
          orderShow: canvas.orderShow || false,
          width: canvas.width || 600,
          index: canvas.index || 0, //多个canvas时的索引
          element: document.getElementById(id) || null,
          ref: (canvas.width || 600) / (this.line + 1), //棋子渲染直径
          ctx: null,
          pointImageDate: [],
          right_menu: canvas.right_menu || false,
          turnShow : canvas.turnShow || false,
          clickFun:
            typeof canvas.clickFun === "function" ? canvas.clickFun : null
        }
      : null;
    if (this.canvas.clickFun) {
      this.modal = "clickDefine";
    } else {
      this.modal = data.modal || "showOnly";
    }
    this.methods = {
      pvp_fall: options.pvp_fall || Chess.middle.blankFun,
      pve_fall: options.pve_fall || Chess.middle.blankFun,
      created: options.created || Chess.middle.blankFun,
      mounted: options.mounted || Chess.middle.blankFun,
      beforeMount: options.beforeMount || Chess.middle.blankFun,
      beforeEat: options.beforeEat || Chess.middle.blankFun
    };
  };
}
function buildMixin(Chess) {
  Chess.build = {
    start() {
      Chess.build.canvasCreate.call(this);
      this.dom = document.getElementById("auto" + this.canvas.index);
      this.canvas.ctx = this.dom.getContext("2d");
      Chess.build.draw_main.call(this);
      this.dom.addEventListener("click", e => {
        Chess.build.eventBind[this.modal].call(this, e, "black");
        // let method = Chess.throttle(Chess.build.eventBind[this.modal].bind(this),100)
        // method(e,'black')
      });
      //右键
      this.dom.oncontextmenu = e => {
        if (this.modal === "setQuestion") {
          Chess.build.eventBind.setQuestion.call(this, e, "white");
        }
        if (!this.canvas.right_menu) {
          return false;
        }
      };
    },
    eventBind: {
      clickDefine(e) {
        this.canvas.clickFun.call(this, e);
      },
      showOnly() {
        console.log("Now JustShow");
      },
      playSelf(e) {
        const getX = e.offsetX;
        const getY = e.offsetY;
        console.log(getX, getY);
        const x = Math.round(getX / this.canvas.ref);
        const y = Math.round(getY / this.canvas.ref);
        if (x < 1 || y < 1 || x > 19 || y > 19) {
          console.log("棋盘外无法落子");
          return;
        }
        const point = x + (y - 1) * this.line;
        Chess.playModal.pvp.call(this, point);
        return point;
      },
      setQuestion(e, color) {
        console.log("Now SetQuestion");
        const getX = e.offsetX;
        const getY = e.offsetY;
        const x = Math.round(getX / this.canvas.ref);
        const y = Math.round(getY / this.canvas.ref);
        if (x < 1 || y < 1 || x > 19 || y > 19) {
          console.log("棋盘外无法落子");
          return;
        }
        const point = x + (y - 1) * this.line;
        Chess.playModal.pve.call(this, point, color);
      }
    },
    draw_main() {
      Chess.build.tableDraw.call(this);
      Chess.build.unSortDraw.call(this, {
        black: this.unsorted_black,
        white: this.unsorted_white
      });
      Chess.build.sortDraw.call(this, this.sorted);
      if(this.canvas.turnShow){
        console.log('show')
        Chess.build.turn_show.call(this)
      }
    },
    canvasCreate() {
      this.canvas.element.innerHTML = `<canvas width="${this.canvas.width +
        "px"}" height="${this.canvas.width +
        "px"}" class="autoCanvas" id="auto${this.canvas.index}"></canvas>`;
    },
    tableDraw() {
      let n = parseInt(this.line),
        ref = this.canvas.ref,
        ctx = this.canvas.ctx;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        ctx.moveTo(ref, ref * (i + 1));
        ctx.lineTo(ref * n, ref * (i + 1));
        ctx.stroke();
      }
      for (let j = 0; j < n; j++) {
        ctx.moveTo(ref * (j + 1), ref);
        ctx.lineTo(ref * (j + 1), ref * n);
        ctx.stroke();
      }
      ctx.closePath();
      for (let i = 1; i < n + 1; i++) {
        for (let j = 1; j < n + 1; j++) {
          this.canvas.pointImageDate[i - 1 + (j - 1) * n] = ctx.getImageData(
            ref * i - ref / 2,
            ref * j - ref / 2,
            ref,
            ref
          );
        }
      }
    },
    turn_show(){
      let show = this.canvas.turnShow,
        line = this.line,
        ref = this.canvas.ref,
        ctx = this.canvas.ctx,
        sorted = this.sorted,
        n = this.first==='black'?1:2;

      if(show===true){
        for(let i = 0;i<sorted.length;i++){
          let r = parseInt(ref/10)
          let color = (n+i)%2===1?'black':'white'
          let point = sorted[i]
          let [x, y] = Chess.position(point, line);
          ctx.textAlign = 'center'
          ctx.font = (ref-r*2)+'px STheiti, SimHei';
          ctx.fillText(i+1,x,y)
        }
        return
      }
      if(show===false){
        console.log(show)
        return
      }
    },
    circleDraw(options) {
      let ref = this.canvas.ref,
        line = this.line,
      ctx = this.canvas.ctx;
      let { pos, color } = options;
      let [x, y] = Chess.position(pos, line);
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(ref * x, ref * y, ref / 2 - 1, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    },
    unSortDraw(options) {
      let { black, white } = options;
      for (let pawn of black) {
        Chess.build.circleDraw.call(this, {
          pos: pawn,
          color: "black"
        });
      }
      for (let pawn of white) {
        Chess.build.circleDraw.call(this, {
          pos: pawn,
          color: "white"
        });
      }
    },
    sortDraw(sortList, firstGo = this.first) {
      let n = firstGo === "black" ? 1 : 2;
      for (let i = 0; i < sortList.length; i++) {
        const item = sortList[i];
        const color = (i + n) % 2 === 1 ? "black" : "white";
        Chess.build.circleDraw.call(this, {
          pos: item,
          color
        });
      }
    },
    nextStep(pos) {
      let n = this.first === "black" ? 1 : 2;
      let len = this.sorted.length;
      let color = (len + n) % 2 === 1 ? "black" : "white";
      Chess.build.circleDraw.call(this, {
        pos,
        color
      });
    },
    clearStep(point) {
      let ref = this.canvas.ref,
        line = this.line,
        ctx = this.canvas.ctx;
      let [x, y] = Chess.position(point, line);
      console.log("clear");
      //恢复初始image
      ctx.putImageData(
        this.canvas.pointImageDate[point - 1],
        x * ref - ref / 2,
        y * ref - ref / 2
      );
    }
  };
}

function staticMixin() {
  Chess.middle = {
    thisBlockBan: true,
    thisBlockEat: true,
    allBlockEat: [],
    thisBlockArray: [],
    isHijack: true,
    hijackBan: null,
    replay_index : null,
    replay_exist : null,
    try_status: {},
    blankFun: () => {}
  };
  Chess.throttle = function(func, delay) {
    var timer = null;
    return function() {
      var context = this;
      var args = arguments;
      if (!timer) {
        timer = setTimeout(function() {
          func.apply(context, args);
          timer = null;
        }, delay);
      }
    };
  };
  Chess.position = function(positionNum, line = 19) {
    if (positionNum === undefined) {
      throw "Please input position";
    }
    let num = parseInt(positionNum),
      n = parseInt(line);
    let y = parseInt((num - 1) / n) + 1,
      x = num % n || n;
    return [x, y];
  };
  Chess.hasChess = function(point, exist) {
    if (
      exist.black.indexOf(point) === -1 &&
      exist.white.indexOf(point) === -1
    ) {
      return false;
    } else {
      return true;
    }
  };
  Chess.initExist = function(options) {
    let { line, first, sorted, unsorted_black, unsorted_white } =
      options || this;
    //要深度拷贝
    this.existPoint = {
      black: unsorted_black.slice(0),
      white: unsorted_white.slice(0)
    };
    let n = first == "black" ? 1 : 2;
    for (let i = 0; i < sorted.length; i++) {
      let color = (n + i) % 2 === 1 ? "black" : "white";
      Chess.updateExist.call(this, sorted[i], {
        color,
        line,
        existPoint: this.existPoint
      });
    }
    return this.existPoint;
  };
  Chess.updateExist = function(point, options) {
    let { color, existPoint, line } = options;
    let n = line || 19;
    let exist = existPoint || this.existPoint;
    //exist加入点
    exist[color].push(point);
    let eatColor = color === "black" ? "white" : "black";
    let ways = Chess.neighbour[Chess.side(point, n)](point, n);
    for (let way of ways) {
      let status = Chess.pointStatus(way, exist);
      //对相邻不是己方的棋子计块
      if (status !== color && status !== "none") {
        Chess.middle.thisBlockArray.push(way);
        Chess.eatBlock(way, options);
        if (Chess.middle.thisBlockEat) {
          Array.prototype.push.apply(
            Chess.middle.allBlockEat,
            Chess.middle.thisBlockArray
          );
        }
        //初始化当前棋块相关参数
        Chess.middle.thisBlockArray = [];
        Chess.middle.thisBlockEat = true;
      } else {
        //周围有气或者有己方棋子，则不是打劫
        Chess.middle.isHijack = false;
      }
    }
    //对所有被吃棋块进行提子
    Chess.middle.allBlockEat = Array.from(new Set(Chess.middle.allBlockEat));
    //对每一步吃的子进行记录，恢复时调用
    this.eatRecord.push(Chess.middle.allBlockEat);
    this.methods.beforeEat.call(this, point, Chess.middle.allBlockEat);
    for (let item of Chess.middle.allBlockEat) {
      let i = exist[eatColor].indexOf(item);
      if (i === -1) {
        console.log("所吃子未出现在棋盘上");
      } else {
        //在此处加入吃子数量累计
        exist[eatColor].splice(i, 1);
        if (this.autoCanvas) {
          Chess.build.clearStep.call(this, item);
        }
      }
    }

    //提子数不为1，则不是打劫
    if (Chess.middle.allBlockEat.length !== 1) {
      Chess.middle.isHijack = false;
    }
    if (Chess.middle.isHijack) {
      console.log("进入打劫状态");
      for (let way of ways) {
        let status = Chess.pointStatus(way, exist);
        if (status === "none") {
          Chess.middle.hijackBan = way;
        }
      }
    }
    Chess.middle.allBlockEat = [];
  };
  Chess.eatBlock = function(point, options) {
    let { color, existPoint, line } = options;
    let n = line || 19;
    let exist = existPoint || this.existPoint;
    let ways = Chess.neighbour[Chess.side(point, n)](point, n);
    for (let way of ways) {
      if (
        Chess.middle.thisBlockArray.indexOf(way) === -1 &&
        Chess.middle.thisBlockEat
      ) {
        let status = Chess.pointStatus(way, exist);
        if (status == "none") {
          Chess.middle.thisBlockEat = false;
          break;
        } else {
          if (status !== color) {
            Chess.middle.thisBlockArray.push(way);
            Chess.eatBlock(way, options);
          }
        }
      }
    }
  };
  Chess.banPoint = function(point, options) {
    Chess.middle.thisBlockArray.push(point);
    Chess.banBlock(point, options);
    //初始化ban参数
    let ban = Chess.middle.thisBlockBan;
    Chess.middle.thisBlockArray = [];
    Chess.middle.thisBlockBan = true;
    return ban;
  };
  Chess.banBlock = function(point, options) {
    let { color, existPoint, line } = options;
    let n = line || 19;
    let exist = existPoint || this.existPoint;
    let ways = Chess.neighbour[Chess.side(point, n)](point, n);
    for (let way of ways) {
      if (
        Chess.middle.thisBlockArray.indexOf(way) === -1 &&
        Chess.middle.thisBlockBan
      ) {
        let status = Chess.pointStatus(way, exist);
        if (status == "none") {
          Chess.middle.thisBlockBan = false;
          break;
        } else {
          if (status == color) {
            Chess.middle.thisBlockArray.push(way);
            Chess.banBlock(way, options);
          }
        }
      }
    }
  };
  //该点状态：黑、白、无
  Chess.pointStatus = function(point, existPoint) {
    let status = "";
    let exist = existPoint || this.existPoint;
    if (exist.black.indexOf(point) !== -1) {
      status = "black";
    } else {
      if (exist.white.indexOf(point) !== -1) {
        status = "white";
      } else {
        status = "none";
      }
    }
    return status;
  };
  Chess.side = function(point, line) {
    let n = line || 19;
    let row = Math.ceil(point / n);
    let column = point % n;
    if (row === 1) {
      if (column === 1) {
        return "top-left";
      }
      if (column === 0) {
        return "top-right";
      }
      return "top";
    }
    if (row === n) {
      if (column === 1) {
        return "bottom-left";
      }
      if (column === 0) {
        return "bottom-right";
      }
      return "bottom";
    }
    if (column === 1) {
      return "left";
    }
    if (column === 0) {
      return "right";
    }
    return "default";
  };
  //棋盘上不同位置棋子的相邻点
  Chess.neighbour = {
    top: (point, line) => {
      let neighbour = [],
        n = line || 19;
      neighbour.push(point - 1, point + 1, point + n);
      return neighbour;
    },
    bottom: (point, line) => {
      let neighbour = [],
        n = line || 19;
      neighbour.push(point - n, point - 1, point + 1);
      return neighbour;
    },
    left: (point, line) => {
      let neighbour = [],
        n = line || 19;
      neighbour.push(point - n, point + 1, point + n);
      return neighbour;
    },
    right: (point, line) => {
      let neighbour = [],
        n = line || 19;
      neighbour.push(point - n, point - 1, point + n);
      return neighbour;
    },
    "top-left": (point, line) => {
      let neighbour = [],
        n = line || 19;
      neighbour.push(point + 1, point + n);
      return neighbour;
    },
    "top-right": (point, line) => {
      let neighbour = [],
        n = line || 19;
      neighbour.push(point - 1, point + n);
      return neighbour;
    },
    "bottom-left": (point, line) => {
      let neighbour = [],
        n = line || 19;
      neighbour.push(point - n, point + 1);
      return neighbour;
    },
    "bottom-right": (point, line) => {
      let neighbour = [],
        n = line || 19;
      neighbour.push(point - n, point - 1);
      return neighbour;
    },
    default: (point, line) => {
      let neighbour = [],
        n = line || 19;
      neighbour.push(point - n, point - 1, point + 1, point + n);
      return neighbour;
    }
  };
  Chess.playModal = {
    // 符合规则的对战模式
    pvp: function(point) {
      let n = this.first == "black" ? 1 : 2;
      let i = this.sorted.length;
      let color = (n + i) % 2 === 1 ? "black" : "white";
      let options = {
        color,
        line: this.line,
        existPoint: this.existPoint
      };
      if (point < 1 || point > 361) {
        console.log("此处在棋盘外");
        return;
      }
      if (Chess.hasChess(point, this.existPoint)) {
        console.log("此处已有棋子");
        return;
      }
      if (point === Chess.middle.hijackBan) {
        console.log("此处刚刚提劫");
        return;
      }
      Chess.middle.hijackBan = null;
      Chess.updateExist.call(this, point, options);
      //此时如果提子，则不会是ban，所以如果是ban，则必然没有提子，不需要exist补回提子
      //先加入exist,从exist里判断，如果ban，则去除exist最后一点
      if (Chess.banPoint(point, options)) {
        console.log("此处为禁入点");
        this.existPoint[color].pop();
        return;
      }
      if (this.autoCanvas) {
        Chess.build.nextStep.call(this, point);
      }
      this.sorted.push(point);
      //初始化打劫参数
      Chess.middle.isHijack = true;
      this.methods.pvp_fall.call(this, point, color);
    },
    // 无视规则的摆棋模式
    pve: function(point, color) {
      color = color || this.setQuestionColor || "black";
      if (point < 1 || point > 361) {
        console.log("此处在棋盘外");
        return;
      }
      if (Chess.hasChess(point, this.existPoint)) {
        console.log("此处已有棋子");
        return;
      }
      this["unsorted_" + color].push(point);
      this.existPoint[color].push(point);
      if (this.autoCanvas) {
        Chess.build.circleDraw.call(this, {
          pos: point,
          color
        });
      }
      this.methods.pve_fall.call(this, point, color);
    },
    // 悔棋模式
    pvp_pop: function() {
      let n = this.first == "black" ? 1 : 2;
      let i = this.sorted.length;
      let pop_color = (n + i) % 2 !== 1 ? "black" : "white";
      let eat_color = (n + i) % 2 === 1 ? "black" : "white";
      let point = this.sorted.pop();
      let backPoints = this.eatRecord.pop();
      this.existPoint[pop_color].pop();
      Array.prototype.push.call(this.existPoint[eat_color], backPoints);
      if (this.autoCanvas) {
        Chess.build.clearStep.call(this, point);
        for (let item of backPoints) {
          Chess.build.circleDraw.call(this, {
            pos: item,
            color: eat_color
          });
        }
      }
    },
    //播放模式：不改变记录
    replay: function(to,from,existPoint) {
      let n = this.first == "black" ? 1 : 2,
        start = from===0?0:(from || this.sorted.length-1),
        exist = existPoint || JSON.parse(JSON.stringify(this.existPoint));
      start = start<-1?-1:start
      to = to<-1?-1:to
      start = start>this.sorted.length-1?this.sorted.length-1:start
      to = to>this.sorted.length-1?this.sorted.length-1:to
      console.log(to,start)
      if(to === start ){return}
      if(to<start){
        for (let i = start; i > to; i--) {
          let cut_color = (n + i) % 2 === 1 ? "black" : "white",
            add_color = (n + i) % 2 !== 1 ? "black" : "white",
            point = this.sorted[i];
          exist[cut_color].splice(exist[cut_color].indexOf(point), 1);
          Array.prototype.push.call(exist[add_color], this.eatRecord[i]);
          if (this.autoCanvas) {
            Chess.build.clearStep.call(this, point);
            for (let item of this.eatRecord[i]) {
              Chess.build.circleDraw.call(this, {
                pos: item,
                color: add_color
              });
            }
          }
        }
      }else{
        for (let i = start+1; i < to+1; i++) {
          let add_color = (n + i) % 2 === 1 ? "black" : "white",
            eat_color = (n + i) % 2 !== 1 ? "black" : "white",
            point = this.sorted[i];
          exist[add_color].push(point);
          for(let record of this.eatRecord[i]){
            let index = exist[eat_color].indexOf(record)
            if(index===-1){
              console.log('error:',index)
            }
            exist[eat_color].splice(index, 1)
          }
          if (this.autoCanvas) {
            Chess.build.circleDraw.call(this, {
              pos: point,
              color: add_color
            });
            for (let item of this.eatRecord[i]) {
              Chess.build.clearStep.call(this, item);
            }
          }
        }
      }

      Chess.middle.replay_index = to
      Chess.middle.replay_exist = exist
    },
    reply_end : function(){
      Chess.playModal.replay.call(this,this.sorted.length-1,Chess.middle.replay_index,Chess.middle.replay_exist)
      Chess.middle.replay_index = null
      Chess.middle.replay_exist = null
    },
    try_start : function(firstGo,existPoint,modal){
      let exist = existPoint || this.existPoint,
          first = firstGo || 'black';
          //记录试下前状态
      Chess.try_status.modal = this.modal
      Chess.try_status.first = this.first
      Chess.try_status.exist = JSON.parse(JSON.stringify(exist))
      Chess.try_status.sorted = this.sorted.slice(0)
      Chess.try_status.unsorted_black = this.unsorted_black.slice(0)
      Chess.try_status.unsorted_white = this.unsorted_white.slice(0)
      //初始化状态
      this.first = first
      this.modal = modal || 'playSelf'
      this.unsorted_black = [exist.black]
      this.unsorted_white = [exist.white]
      this.existPoint.black = [exist.black]
      this.existPoint.white = [exist.white]
      this.sorted = []
      if(this.autoCanvas){
        Chess.status.iamgeData = this.canvas.ctx.getImageData(0,0,this.canvas.width,this.canvas.width)
      }
    },
    try_end : function(){
      this.first=Chess.try_status.first
      this.exist=Chess.try_status.exist
      this.sorted=Chess.try_status.sorted
      this.unsorted_black=Chess.try_status.unsorted_black
      this.unsorted_white=Chess.try_status.unsorted_white
      try_status = {}
      if(this.autoCanvas){
        this.canvas.ctx.putImageData(Chess.try_status.iamgeData,0,0)
      }
    },
  };
}

//打劫hijack逻辑：1、落子后是单子，和周围无法构成block（周围status不一样）
//打劫hijack逻辑：2、落子后有且只吃一颗子：引入status记录block.push次数，必须为1才变为打劫状态
//打劫hijack逻辑：3、判断进入打劫状态后，记录被吃点为此时（重要：对手）额外禁入点，引入BanPoint
//打劫hijack逻辑：4、判断进入打劫状态后，立即记录当前sorted.length，只要不是length+1,那么就不是禁入点(banpoint&&length+1)
//注意：在吃子时加入判断

function imitateClick(oElement, iClientX, iClientY) {
  var oEvent;
  if (document.createEventObject) {
    //For IE
    oEvent = document.createEventObject();
    oEvent.clientX = iClientX;
    oEvent.clientY = iClientY;
    oElement.fireEvent("onclick", oEvent);
  } else {
    oEvent = document.createEvent("MouseEvents");
    oEvent.initMouseEvent(
      "click",
      true,
      true,
      document.defaultView,
      0,
      0,
      0,
      iClientX,
      iClientY /*, false, false, false, false, 0, null*/
    );
    oElement.dispatchEvent(oEvent);
  }
}
