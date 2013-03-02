var FPS = 30;
var FIELD_COL_MAX   = 6;
var FIELD_ROW_MAX   = 14;
var CELL_SIZE     = 24;
var FIELD_WIDTH   = 720;
var FIELD_HIGHT   = 480;
// Number of Puyo
var PUYO_TYPE_NUM     = 5; // ぷよぷよの種類
var BLOCK_TYPE_NONE   = 0;
var BLOCK_TYPE_BLUE   = 1; // blue
var BLOCK_TYPE_GREEN  = 2; // green
var BLOCK_TYPE_PURPLE = 3; // purple
var BLOCK_TYPE_RED    = 4; // red
var BLOCK_TYPE_YELLOW = 5; // yellow
var BLOCK_TYPE_OJAMA  = 6; // ojama
var BLOCK_TYPE_WALL   = 7; // wall
// 各ぷよぷよの画像ファイル名
var names = {};
names[BLOCK_TYPE_BLUE]    = "pb";
names[BLOCK_TYPE_GREEN]   = "pg";
names[BLOCK_TYPE_PURPLE]  = "pp";
names[BLOCK_TYPE_RED]     = "pr";
names[BLOCK_TYPE_YELLOW]  = "py";
names[BLOCK_TYPE_OJAMA]   = "po";
names[BLOCK_TYPE_WALL]    = "pw";

// 各ぷよぷよ画像のリスト
var imgs = {};
for ( var key in names ){
  var img = new Image();
  img.src = "img/" + names[key] + ".gif";
  imgs[key] = img;
}

function Matrix(row_size, col_size, default_value) {
  var res = [];
  for ( var r = 0; r < row_size; ++r ) {
    var list = [];
    for ( var c = 0; c < col_size; ++c ) {
      list.push(default_value);
    }
    res.push(list);
  }
  return res;
};

/**
 * ぷよを取り扱うクラス
 */
var Puyo = function(r, c){
  this.r = r;
  this.c = c;
  this.type = Math.floor(Math.random() * PUYO_TYPE_NUM) + 1;
  this.controllable = false; // 着地しているかどうか
  /**
   * ぷよを描画する
   * @param Context ctx
   */
  this.render = function(ctx){
    var w = imgs[this.type].width;
    var h = imgs[this.type].height;
    ctx.save();
    ctx.drawImage(imgs[this.type], 0, 0, w, h, this.c * CELL_SIZE, this.r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.restore();
  };
};

function inField(tr, tc){
  return ( 0 <= tr && tr < FIELD_ROW_MAX && 0 <= tc && tc < FIELD_COL_MAX );
};
/**
 * 対象となるぷよ（座標(tr, tc))が他の物体と衝突しているかどうか
 * @return bool 衝突していればtrue.
 */
function collision(tr, tc){
  return ( ( inField(tr, tc) && field[tr][tc] != BLOCK_TYPE_NONE ) || !inField(tr, tc) );
};

/**
 * ハーピー積み
 */
var AI = function(field) {
  this.tr = FIELD_ROW_MAX - 1;
  this.tc = 0;
  this.rotate_num = 0;
  this.rotate_cnt = 0;
  this.field = field;
  /**
   * @param Puyopuyo puyopuyo
   * @param int cr candicate row
   * @param int cc candidate column
   * @return evaluate value
   */
  this.evaluate = function(puyopuyo, tr, tc, rnum) {
    var dc = [1, 0, -1, 0];
    var dr = [0, 1, 0, -1];
    var res = tr;
    if ( rnum == 0 ) { // 無回転
      for ( var i = 0; i < 4; ++i ) {
        var nr = tr + dr[i];
        var nc = tc + dc[i];
        if ( inField(nr, nc) && puyopuyo[1].type == this.field[nr][nc] ) {
          res += 1000;
        }
      }
    } else if ( rnum == 2 ) { // 180 度回転
      for ( var i = 0; i < 4; ++i ) {
        var nr = tr + dr[i];
        var nc = tc + dc[i];
        if ( inField(nr, nc) && puyopuyo[0].type == this.field[nr][nc] ) {
          res += 1000;
        }
      }
    }
    // なるだけ下に積める方が評価値が高いようにしている．
    return res;
  };
  this.next = function(puyopuyo) {
    this.rotate_cnt = 0;
    var eval_max = 0;
    for ( var c = 0; c < FIELD_COL_MAX; ++c ) {
      for ( var r = FIELD_ROW_MAX - 1; r > 3; --r ) {
        for ( var rnum = 0; rnum <= 2; rnum += 2 ) {
          if ( this.field[r][c] == BLOCK_TYPE_NONE ) {
            var cur_eval = this.evaluate(puyopuyo, r, c, rnum);
            if ( eval_max < cur_eval ) {
              this.tr = r;
              this.tc = c;
              this.rotate_num = rnum;
              eval_max = cur_eval;
            }
          }
        }
      }
    }
  };
  this.calculate = function(puyopuyo) {
    // ai calculation.
    Input.release(KeyCode.Left);
    Input.release(KeyCode.Right);
    Input.release(KeyCode.Down);
    Input.release(KeyCode.Z);
    // 回転 -> 左右移動 -> 下移動の順に優先
    if ( this.rotate_cnt < this.rotate_num ) { Input.press(KeyCode.Z); ++this.rotate_cnt; }
    if ( this.tc < puyopuyo[0].c && !puyopuyo.collision(0, -1) ) { Input.press(KeyCode.Left); }
    else if ( puyopuyo[0].c < this.tc && !puyopuyo.collision(0, 1) ) { Input.press(KeyCode.Right); }
    if ( puyopuyo[0].r < this.tr ) { Input.press(KeyCode.Down); }
  };
};

var field = Matrix(FIELD_ROW_MAX, FIELD_COL_MAX, BLOCK_TYPE_NONE);

var cur_chained_num = 0;
var max_chained_num = 0;
var controllable = true;
$(function() {
  var ctx = $("canvas")[0].getContext("2d");
  var frame_count = 0;
  // 落下ぷよの生成
  var puyopuyo = [];
  puyopuyo.push( new Puyo(0, FIELD_COL_MAX / 2) );
  puyopuyo.push( new Puyo(1, FIELD_COL_MAX / 2) );
  puyopuyo.fall = function() { for ( var i = 0; i < this.length; ++i ) ++this[i].r; };
  puyopuyo.render = function(ctx) {
    for ( var i = 0; i < this.length; ++i ){
      this[i].render(ctx);
    }
  };

  var ai = new AI(field);
  puyopuyo.center = function() { return {r: this[0].r, c: this[0].c}; }
  puyopuyo.canMove = function(){
    for ( var i = 0; i < this.length; ++i ){
      var nr = this[i].r, nc = this[i].c;
      // updating phase
      if ( Input.onPressed(KeyCode.Down) ) ++nr;
      if ( Input.onPressed(KeyCode.Left) ) --nc;
      if ( Input.onPressed(KeyCode.Right) ) ++nc;
      // update the poyopuyo position
      if ( collision(nr, nc) ) return false;
    }
    // 回転できるかどうか
    if ( Input.onPressed(KeyCode.Z) ){
      for ( var i = 1; i < this.length; ++i ){
        var dr = this[i].r - this.center().r;
        var dc = this[i].c - this.center().c;
        var nr = this[i].r - dr + dc;
        var nc = this[i].c - dc - dr;
        if ( collision(nr, nc) ){
          return false;
        }
      }
    }
    return true;
  };
  puyopuyo.move = function(){
    for ( var i = 0; i < this.length; ++i ){
      var nr = puyopuyo[i].r, nc = puyopuyo[i].c;
      // updating phase
      if ( Input.onPressed(KeyCode.Down) ) ++nr;
      if ( Input.onPressed(KeyCode.Left) ) --nc;
      if ( Input.onPressed(KeyCode.Right) ) ++nc;
      this[i].r = nr;
      this[i].c = nc;
    }
    // 回転する
    if ( Input.onPressed(KeyCode.Z) ){
      for ( var i = 1; i < this.length; ++i ){
        var dr = this[i].r - this.center().r;
        var dc = this[i].c - this.center().c;
        var nr = this[i].r - dr + dc;
        var nc = this[i].c - dc - dr;
        this[i].r = nr;
        this[i].c = nc;
      }
    }
  };
  puyopuyo.collision = function(dr, dc) {
    for ( var i = 0; i < this.length; ++i ) {
      if ( collision(this[i].r + dr, this[i].c + dc) ) {
        return true;
      }
    }
    return false;
  };
  field.droppable = function(){
    for ( var r = FIELD_ROW_MAX-2; r >= 0; --r ){
      for ( var c = 0; c < FIELD_COL_MAX; ++c ){
        if ( this[r][c] != BLOCK_TYPE_NONE && this[r+1][c] == BLOCK_TYPE_NONE ) {
          return true;
        }
      }
    }
    return false;
  };
  field.drop = function(){
    for ( var r = FIELD_ROW_MAX-2; r >= 0; --r ){
      for ( var c = 0; c < FIELD_COL_MAX; ++c ){
        if ( this[r][c] != BLOCK_TYPE_NONE && this[r+1][c] == BLOCK_TYPE_NONE ) {
          this[r+1][c] = this[r][c];
          this[r][c] = BLOCK_TYPE_NONE;
        }
      }
    }
  };
  field.set = function(tr, tc, type) {
    this[tr][tc] = type;
  };
  field.render = function(ctx) {
    for ( var r = 0; r < FIELD_ROW_MAX; ++r ){
      for ( var c = 0; c < FIELD_COL_MAX; ++c ){
        if ( this[r][c] != BLOCK_TYPE_NONE ){
          var type = this[r][c];
          var w = imgs[type].width;
          var h = imgs[type].height;
          ctx.save();
          ctx.drawImage(imgs[type], 0, 0, w, h, c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.restore();
        }
      }
    }
  };
  /**
   * ぷよが削除されたかどうか。削除されたらtrue.
   * BFS algorithm
   * @return bool 
   */
  var erased = function() {
    var used = Matrix(FIELD_ROW_MAX, FIELD_COL_MAX, false);
    var can = false; // ぷよを消去できるかどうか
    var dr = [1, 0, -1, 0];
    var dc = [0, 1, 0, -1];
    for ( var r = FIELD_ROW_MAX-1; r >= 0; --r ) {
      for ( var c = 0; c < FIELD_COL_MAX; ++c ) {
        if ( !used[r][c] && field[r][c] != BLOCK_TYPE_NONE ) {
          var type = field[r][c].type;
          var queue = [{r:r,c:c}];
          used[r][c] = true;
          var list = [{r:r,c:c}]; // 連結しているぷよの位置
          while ( queue.length > 0 ) {
            var pos = queue.pop();
            for ( var i = 0; i < 4; ++i ) {
              var nr = pos.r + dr[i];
              var nc = pos.c + dc[i];
              if ( inField(nr,nc) && !used[nr][nc] && field[pos.r][pos.c] == field[nr][nc] ) {
                queue.push({r:nr,c:nc});
                used[nr][nc] = true;
                list.push({r:nr,c:nc});
              }
            }
          }
          if ( list.length >= 4 ){ // 連鎖
            can = true;
            for ( var i = 0; i < list.length; ++i ){
              field[list[i].r][list[i].c] = BLOCK_TYPE_NONE;
            }
          }
        }
      }
    }
    return can;
  };
  function update() {
    if ( controllable ){
      if ( true ) { // Input.onPressed(KeyCode.Shift) ) {
        ai.calculate(puyopuyo);
      }
      // fall down
      if ( frame_count % 12 == 0 ) puyopuyo.fall();
      // move
      if ( puyopuyo.canMove() ) puyopuyo.move();
      // land
      for ( var i = 0; i < puyopuyo.length; ++i ){
        var r = puyopuyo[i].r;
        var c = puyopuyo[i].c;
        if ( (inField(r+1,c) && field[r+1][c] != BLOCK_TYPE_NONE) || r+1 == FIELD_ROW_MAX ){
          controllable = false;
        }
      }
      if ( !controllable ){
        for ( var i = 0; i < puyopuyo.length; ++i ){
          field.set( puyopuyo[i].r, puyopuyo[i].c, puyopuyo[i].type );
        }
      }
    } else {
      if ( field.droppable() ){ // 落下しているぷよが存在
        field.drop();
      } else if ( erased() ) {
        ++cur_chained_num;
        max_chained_num = Math.max(max_chained_num, cur_chained_num);
      } else { // 消去できるぷよが存在しない場合は次のぷよを落下
        cur_chained_num = 0;
        for ( i = 0; i < puyopuyo.length; ++i ){
          puyopuyo[i] = new Puyo(i, FIELD_COL_MAX / 2);
        }
        ai.next(puyopuyo);
        controllable = true;
      }
    }
    ++frame_count;
  };
  function render(ctx) {
    // rendering phase
    ctx.clearRect(0, 0, FIELD_WIDTH, FIELD_HIGHT);
    field.render(ctx);
    puyopuyo.render(ctx);

    $("#cur_chained_num").text(cur_chained_num);
    $("#max_chained_num").text(max_chained_num);
    $("#elapsed_time").text(Math.floor(frame_count / FPS));
  };
  function main() {
    update();
    render(ctx);
  };
  // set FPS
  setInterval(main, 1000 / FPS);
});
